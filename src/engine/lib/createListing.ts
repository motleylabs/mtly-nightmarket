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
  getMetadataAccount,
  getPNFTAccounts,
  toLamports,
} from '../../utils';
import { RewardCenterProgram } from '../modules';
import {
  CreateListingInstructionAccounts,
  CreateListingInstructionArgs,
  createCreateListingInstruction,
} from '@motleylabs/mtly-reward-center';
import { getMetadata } from '../../utils';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';

export const getCreateListingInstructions = async ({
  connection,
  auctionHouse,
  mint,
  amount,
  seller,
  budgetIxNeeded = true,
}: {
  connection: Connection;
  auctionHouse: AuctionHouse;
  mint: PublicKey;
  amount: number;
  seller: PublicKey;
  budgetIxNeeded: boolean;
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
  const metadata = getMetadataAccount(mint);
  const token = auctionHouse.rewardCenter!.tokenMint;
  const associatedTokenAccount = getAssociatedTokenAddressSync(mint, seller);

  const mintMetadata = await getMetadata(connection, metadata);
  if (!mintMetadata) {
    throw 'metadata not found';
  }

  const [sellerTradeState, tradeStateBump] =
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

  const [freeTradeState, freeTradeStateBump] =
    AuctionHouseProgram.findTradeStateAddress(
      seller,
      auctionHouseAddress,
      associatedTokenAccount,
      treasuryMint,
      mint,
      0,
      1,
    );

  const [rewardCenter] =
    RewardCenterProgram.findRewardCenterAddress(auctionHouseAddress);

  const [listingAddress] = RewardCenterProgram.findListingAddress(
    seller,
    metadata,
    rewardCenter,
  );

  const [auctioneer] = RewardCenterProgram.findAuctioneerAddress(
    auctionHouseAddress,
    rewardCenter,
  );

  const accounts: CreateListingInstructionAccounts = {
    auctionHouseProgram: AuctionHouseProgram.PUBKEY,
    listing: listingAddress,
    rewardCenter: rewardCenter,
    wallet: seller,
    tokenAccount: associatedTokenAccount,
    metadata,
    authority: authority,
    auctionHouse: auctionHouseAddress,
    auctionHouseFeeAccount: auctionHouseFeeAccount,
    sellerTradeState: sellerTradeState,
    freeSellerTradeState: freeTradeState,
    ahAuctioneerPda: auctioneer,
    programAsSigner: programAsSigner,
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
    remainingAccounts.push(pnftAccounts.tokenRecord);
    remainingAccounts.push(pnftAccounts.tokenMint);
    remainingAccounts.push(pnftAccounts.edition);
    remainingAccounts.push(pnftAccounts.authRulesProgram);
    remainingAccounts.push(pnftAccounts.authRules);
    remainingAccounts.push(pnftAccounts.sysvarInstructions);
    accounts.anchorRemainingAccounts = remainingAccounts;
  }

  const args: CreateListingInstructionArgs = {
    createListingParams: {
      price: buyerPrice,
      tokenSize: 1,
      tradeStateBump,
      freeTradeStateBump,
      programAsSignerBump: programAsSignerBump,
    },
  };

  const instruction = createCreateListingInstruction(accounts, args);

  for (let i = 0; i < instruction.keys.length; i++) {
    if (instruction.keys[i].pubkey.equals(metadata)) {
      instruction.keys[i].isWritable = true;
    }
  }

  const sellerRewardTokenAccount = getAssociatedTokenAddressSync(token, seller);

  const sellerATAInstruction =
    createAssociatedTokenAccountIdempotentInstruction(
      seller,
      sellerRewardTokenAccount,
      seller,
      token,
    );

  const ixs: TransactionInstruction[] = [];

  ixs.push(sellerATAInstruction, instruction);

  if (budgetIxNeeded) {
    const culIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 });
    ixs.push(culIx);
    const cupIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1000,
    });
    ixs.push(cupIx);
  }

  return ixs;
};
