import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  AccountMeta,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { AuctionHouse } from '../../types';
import {
  AuctionHouseProgram,
  getMetadata,
  getMetadataAccount,
  getPNFTAccounts,
  toLamports,
} from 'src/utils';
import { RewardCenterProgram } from '../modules';
import {
  BuyListingInstructionAccounts,
  BuyListingInstructionArgs,
  createBuyListingInstruction,
} from '@motleylabs/mtly-reward-center';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';

export const getBuyListingIxs = async ({
  connection,
  auctionHouse,
  mint,
  amount,
  seller,
  buyer,
}: {
  connection: Connection;
  auctionHouse: AuctionHouse;
  mint: PublicKey;
  amount: number;
  seller: PublicKey;
  buyer: PublicKey;
}): Promise<TransactionInstruction[]> => {
  if (!auctionHouse.rewardCenter) {
    throw 'reward center data not found';
  }

  const auctionHouseAddress = new PublicKey(auctionHouse.address);
  const treasuryMint = new PublicKey(auctionHouse.treasuryMint);
  const associatedTokenAcc = getAssociatedTokenAddressSync(mint, seller);

  // find bump
  const [sellerTradeState, sellerTradeStateBump] =
    RewardCenterProgram.findAuctioneerTradeStateAddress(
      seller,
      auctionHouseAddress,
      associatedTokenAcc,
      treasuryMint,
      mint,
      1,
    );

  const listedPrice = toLamports(amount);
  const authority = new PublicKey(auctionHouse.authority);
  const ahFeeAcc = new PublicKey(auctionHouse.auctionHouseFeeAccount);
  const auctionHouseTreasury = new PublicKey(auctionHouse.auctionHouseTreasury);
  const metadata = getMetadataAccount(mint);
  const mintMetadata = await getMetadata(connection, metadata);
  if (!mintMetadata) {
    throw 'metadata not found';
  }

  const token = new PublicKey(auctionHouse.rewardCenter.tokenMint);
  const [buyerTradeState, buyerTradeStateBump] =
    AuctionHouseProgram.findPublicBidTradeStateAddress(
      buyer,
      auctionHouseAddress,
      treasuryMint,
      mint,
      listedPrice,
      1,
    );

  const [escrowPaymentAccount, escrowPaymentBump] =
    AuctionHouseProgram.findEscrowPaymentAccountAddress(
      auctionHouseAddress,
      buyer,
    );

  const buyerReceiptTokenAccount = await getAssociatedTokenAddress(mint, buyer);

  const [programAsSigner, programAsSignerBump] =
    AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();

  const [freeSellerTradeState, freeSellerTradeBump] =
    AuctionHouseProgram.findTradeStateAddress(
      seller,
      auctionHouseAddress,
      associatedTokenAcc,
      treasuryMint,
      mint,
      0,
      1,
    );

  const [rewardCenter] =
    RewardCenterProgram.findRewardCenterAddress(auctionHouseAddress);
  const [listing] = RewardCenterProgram.findListingAddress(
    seller,
    metadata,
    rewardCenter,
  );

  const [auctioneer] = RewardCenterProgram.findAuctioneerAddress(
    auctionHouseAddress,
    rewardCenter,
  );

  const rewardCenterRewardTokenAccount = await getAssociatedTokenAddress(
    token,
    rewardCenter,
    true,
  );

  const buyerRewardTokenAccount = await getAssociatedTokenAddress(token, buyer);

  const buyerATAInstruction = createAssociatedTokenAccountInstruction(
    buyer,
    buyerRewardTokenAccount,
    buyer,
    token,
  );

  const sellerRewardTokenAccount = await getAssociatedTokenAddress(
    token,
    seller,
  );

  const accounts: BuyListingInstructionAccounts = {
    buyer: buyer,
    buyerRewardTokenAccount,
    seller,
    sellerRewardTokenAccount,
    listing,
    tokenAccount: associatedTokenAcc,
    paymentAccount: buyer,
    transferAuthority: buyer,
    tokenMint: mint,
    metadata,
    treasuryMint,
    sellerPaymentReceiptAccount: seller,
    buyerReceiptTokenAccount,
    authority,
    escrowPaymentAccount,
    auctionHouse: auctionHouseAddress,
    auctionHouseFeeAccount: ahFeeAcc,
    auctionHouseTreasury,
    sellerTradeState,
    buyerTradeState,
    freeSellerTradeState,
    rewardCenter,
    rewardCenterRewardTokenAccount,
    ahAuctioneerPda: auctioneer,
    programAsSigner,
    auctionHouseProgram: AuctionHouseProgram.PUBKEY,
  };

  const args: BuyListingInstructionArgs = {
    buyListingParams: {
      escrowPaymentBump,
      freeTradeStateBump: freeSellerTradeBump,
      sellerTradeStateBump,
      programAsSignerBump,
      buyerTradeStateBump,
    },
  };

  const ixs: TransactionInstruction[] = [];

  const buyListingIx = createBuyListingInstruction(accounts, args);

  let remainingAccounts: AccountMeta[] = [];

  // find NFT creators
  if (!!mintMetadata.data.creators) {
    for (const creator of mintMetadata.data.creators) {
      const creatorAccount = {
        pubkey: new PublicKey(creator.address),
        isSigner: false,
        isWritable: true,
      };
      remainingAccounts = [...remainingAccounts, creatorAccount];
    }
  }

  if (mintMetadata.tokenStandard === TokenStandard.ProgrammableNonFungible) {
    const pnftAccounts = await getPNFTAccounts(
      connection,
      buyer,
      programAsSigner,
      mint,
      seller,
    );

    remainingAccounts.push(pnftAccounts.metadataProgram);
    remainingAccounts.push(pnftAccounts.edition);
    remainingAccounts.push(pnftAccounts.sellerTokenRecord);
    remainingAccounts.push(pnftAccounts.tokenRecord);
    remainingAccounts.push(pnftAccounts.authRulesProgram);
    remainingAccounts.push(pnftAccounts.authRules);
    remainingAccounts.push(pnftAccounts.sysvarInstructions);
  }

  const buyerAtAInfo = await connection.getAccountInfo(buyerRewardTokenAccount);

  // patch metadata account to writable for AH / RWD
  for (let i = 0; i < buyListingIx.keys.length; i++) {
    if (buyListingIx.keys[i].pubkey.equals(metadata)) {
      buyListingIx.keys[i].isWritable = true;
    }
  }

  const keys = buyListingIx.keys.concat(remainingAccounts);

  const ix = ComputeBudgetProgram.setComputeUnitLimit({ units: 1000000 });
  ixs.push(ix);

  if (!buyerAtAInfo) {
    ixs.push(buyerATAInstruction);
  }

  ixs.push(
    new TransactionInstruction({
      programId: RewardCenterProgram.PUBKEY,
      data: buyListingIx.data,
      keys,
    }),
  );

  return ixs;
};
