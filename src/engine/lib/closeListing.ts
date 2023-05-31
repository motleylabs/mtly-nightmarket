import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  AccountMeta,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { AuctionHouse } from '../../types';
import { AuctionHouseProgram, getMetadata, getMetadataAccount, getPNFTAccounts } from '../../utils';
import { RewardCenterProgram } from '../modules';
import {
  CloseListingInstructionAccounts,
  createCloseListingInstruction,
} from '@motleylabs/mtly-reward-center';
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';

export const getCloseListingInstructions = async ({
  connection,
  auctionHouse,
  mint,
  seller,
}: {
  connection: Connection;
  auctionHouse: AuctionHouse;
  mint: PublicKey;
  seller: PublicKey;
}): Promise<TransactionInstruction[]> => {
  const auctionHouseAddress = new PublicKey(auctionHouse.address);
  const authority = new PublicKey(auctionHouse.authority);
  const auctionHouseFeeAccount = new PublicKey(auctionHouse.auctionHouseFeeAccount);
  const treasuryMint = new PublicKey(auctionHouse.treasuryMint);
  const metadata = getMetadataAccount(mint);
  const associatedTokenAccount = getAssociatedTokenAddressSync(mint, seller);

  const mintMetadata = await getMetadata(connection, metadata);
  if (!mintMetadata) {
    throw 'metadata not found';
  }

  const [sellerTradeState] = RewardCenterProgram.findAuctioneerTradeStateAddress(
    seller,
    auctionHouseAddress,
    associatedTokenAccount,
    treasuryMint,
    mint,
    1
  );

  const [rewardCenter] = RewardCenterProgram.findRewardCenterAddress(auctionHouseAddress);

  const [listingAddress] = RewardCenterProgram.findListingAddress(seller, metadata, rewardCenter);

  const [auctioneer] = RewardCenterProgram.findAuctioneerAddress(auctionHouseAddress, rewardCenter);

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
    const [programAsSigner] = AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();
    const pnftAccounts = await getPNFTAccounts(connection, seller, programAsSigner, mint);
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

  const instruction = createCloseListingInstruction(accounts);

  const ixs: TransactionInstruction[] = [];

  ixs.push(instruction);

  const culIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 });
  ixs.push(culIx);
  const cupIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });
  ixs.push(cupIx);

  return ixs;
};
