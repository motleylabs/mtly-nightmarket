import {
  createAssociatedTokenAccountIdempotentInstruction,
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
} from '../../utils';
import { RewardCenterProgram } from '../modules';
import {
  AcceptOfferInstructionAccounts,
  AcceptOfferInstructionArgs,
  CloseListingInstructionAccounts,
  createAcceptOfferInstruction,
  createCloseListingInstruction,
} from '@motleylabs/mtly-reward-center';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';

export const getAcceptOfferInstructions = async ({
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
  const buyerPrice = toLamports(amount);
  const authority = new PublicKey(auctionHouse.authority);
  const auctionHouseFeeAccount = new PublicKey(
    auctionHouse.auctionHouseFeeAccount,
  );
  const treasuryMint = new PublicKey(auctionHouse.treasuryMint);
  const auctionHouseTreasury = new PublicKey(auctionHouse.auctionHouseTreasury);
  const metadata = getMetadataAccount(mint);

  const mintMetadata = await getMetadata(connection, metadata);
  if (!mintMetadata) {
    throw 'metadata not found';
  }

  const token = auctionHouse.rewardCenter.tokenMint;
  const associatedTokenAccount = getAssociatedTokenAddressSync(mint, seller);

  const [buyerTradeState, buyerTradeStateBump] =
    AuctionHouseProgram.findPublicBidTradeStateAddress(
      buyer,
      auctionHouseAddress,
      treasuryMint,
      mint,
      buyerPrice,
      1,
    );

  const [rewardCenter] =
    RewardCenterProgram.findRewardCenterAddress(auctionHouseAddress);

  const [escrowPaymentAccount, escrowPaymentBump] =
    AuctionHouseProgram.findEscrowPaymentAccountAddress(
      auctionHouseAddress,
      buyer,
    );

  const rewardCenterRewardTokenAccount = getAssociatedTokenAddressSync(
    token,
    rewardCenter,
    true,
  );

  const buyerReceiptTokenAccount = getAssociatedTokenAddressSync(mint, buyer);

  const [sellerTradeState, sellerTradeStateBump] =
    RewardCenterProgram.findAuctioneerTradeStateAddress(
      seller,
      auctionHouseAddress,
      associatedTokenAccount,
      treasuryMint,
      mint,
      1,
    );

  const [programAsSigner, programAsSignerBump] =
    AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();

  const [freeSellerTradeState, freeTradeStateBump] =
    AuctionHouseProgram.findTradeStateAddress(
      seller,
      auctionHouseAddress,
      associatedTokenAccount,
      treasuryMint,
      mint,
      0,
      1,
    );

  const [rewardsOffer] = RewardCenterProgram.findOfferAddress(
    buyer,
    metadata,
    rewardCenter,
  );

  const [auctioneer] = RewardCenterProgram.findAuctioneerAddress(
    auctionHouseAddress,
    rewardCenter,
  );

  const buyerRewardTokenAccount = getAssociatedTokenAddressSync(token, buyer);
  const sellerRewardTokenAccount = getAssociatedTokenAddressSync(token, seller);

  const sellerATAInstruction =
    createAssociatedTokenAccountIdempotentInstruction(
      seller,
      sellerRewardTokenAccount,
      seller,
      token,
    );

  const acceptOfferAccounts: AcceptOfferInstructionAccounts = {
    buyer: buyer,
    buyerRewardTokenAccount,
    seller: seller,
    sellerRewardTokenAccount,
    offer: rewardsOffer,
    tokenAccount: associatedTokenAccount,
    tokenMint: mint,
    metadata,
    treasuryMint,
    sellerPaymentReceiptAccount: seller,
    buyerReceiptTokenAccount,
    authority,
    escrowPaymentAccount,
    auctionHouse: auctionHouseAddress,
    auctionHouseFeeAccount,
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

  const acceptOfferArgs: AcceptOfferInstructionArgs = {
    acceptOfferParams: {
      escrowPaymentBump,
      freeTradeStateBump,
      sellerTradeStateBump,
      programAsSignerBump,
      buyerTradeStateBump,
    },
  };

  const acceptOfferIx = createAcceptOfferInstruction(
    acceptOfferAccounts,
    acceptOfferArgs,
  );

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

    remainingAccounts.push(pnftAccounts.metadataProgram);
    remainingAccounts.push(pnftAccounts.delegateRecord);
    remainingAccounts.push(pnftAccounts.sellerTokenRecord);
    remainingAccounts.push(pnftAccounts.tokenMint);
    remainingAccounts.push(pnftAccounts.edition);
    remainingAccounts.push(pnftAccounts.authRulesProgram);
    remainingAccounts.push(pnftAccounts.authRules);
    remainingAccounts.push(pnftAccounts.sysvarInstructions);
  }

  // patch metadata account to writable for AH / RWD
  for (let i = 0; i < acceptOfferIx.keys.length; i++) {
    if (acceptOfferIx.keys[i].pubkey.equals(metadata)) {
      acceptOfferIx.keys[i].isWritable = true;
    }
  }

  const keys = acceptOfferIx.keys.concat(remainingAccounts);

  const ix = ComputeBudgetProgram.setComputeUnitLimit({ units: 1000000 });

  const ixs: TransactionInstruction[] = [];

  ixs.push(ix);

  // add instruction to close listing if exists
  const [listingAddress] = RewardCenterProgram.findListingAddress(
    seller,
    metadata,
    rewardCenter,
  );
  const listingAccount = await connection.getAccountInfo(
    listingAddress,
    'confirmed',
  );
  if (!!listingAccount) {
    const accounts: CloseListingInstructionAccounts = {
      auctionHouseProgram: AuctionHouseProgram.PUBKEY,
      listing: listingAddress,
      rewardCenter: rewardCenter,
      wallet: seller,
      tokenAccount: associatedTokenAccount,
      metadata: metadata,
      authority: authority,
      auctionHouse: auctionHouseAddress,
      auctionHouseFeeAccount: auctionHouseFeeAccount,
      tokenMint: mint,
      tradeState: sellerTradeState,
      ahAuctioneerPda: auctioneer,
    };

    if (mintMetadata.tokenStandard === TokenStandard.ProgrammableNonFungible) {
      const pnftAccounts = await getPNFTAccounts(
        connection,
        seller,
        programAsSigner,
        mint,
      );
      const remainingAccounts: AccountMeta[] = [];
      remainingAccounts.push(pnftAccounts.metadataProgram);
      remainingAccounts.push(pnftAccounts.delegateRecord);
      remainingAccounts.push(pnftAccounts.programAsSigner);
      remainingAccounts.push({
        isSigner: false,
        isWritable: true,
        pubkey: metadata,
      });
      remainingAccounts.push(pnftAccounts.edition);
      remainingAccounts.push(pnftAccounts.tokenRecord);
      remainingAccounts.push(pnftAccounts.tokenMint);
      remainingAccounts.push(pnftAccounts.authRulesProgram);
      remainingAccounts.push(pnftAccounts.authRules);
      remainingAccounts.push(pnftAccounts.sysvarInstructions);
      remainingAccounts.push(pnftAccounts.systemProgram);
      accounts.anchorRemainingAccounts = remainingAccounts;
    }

    const closeListingIx = createCloseListingInstruction(accounts);

    ixs.push(closeListingIx);
  }

  // add instruction to create a seller ATA for reward token
  ixs.push(sellerATAInstruction);

  // add accept offer instruction
  ixs.push(
    new TransactionInstruction({
      programId: RewardCenterProgram.PUBKEY,
      data: acceptOfferIx.data,
      keys,
    }),
  );

  return ixs;
};
