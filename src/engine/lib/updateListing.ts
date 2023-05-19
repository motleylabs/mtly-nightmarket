import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { AuctionHouse } from '../../types';
import { AuctionHouseProgram, getMetadataAccount, toLamports } from 'src/utils';
import { RewardCenterProgram } from '../modules';
import {
  UpdateListingInstructionAccounts,
  UpdateListingInstructionArgs,
  createUpdateListingInstruction,
} from '@motleylabs/mtly-reward-center';

export const getUpdateListingIxs = ({
  auctionHouse,
  mint,
  amount,
  seller,
}: {
  auctionHouse: AuctionHouse;
  mint: PublicKey;
  amount: number;
  seller: PublicKey;
}): TransactionInstruction[] => {
  const auctionHouseAddress = new PublicKey(auctionHouse.address);
  const buyerPrice = toLamports(amount);
  const metadata = getMetadataAccount(mint);

  const associatedTokenAccount = getAssociatedTokenAddressSync(mint, seller);

  const [rewardCenter] =
    RewardCenterProgram.findRewardCenterAddress(auctionHouseAddress);

  const [listingAddress] = RewardCenterProgram.findListingAddress(
    seller,
    metadata,
    rewardCenter,
  );

  const accounts: UpdateListingInstructionAccounts = {
    auctionHouseProgram: AuctionHouseProgram.PUBKEY,
    listing: listingAddress,
    rewardCenter: rewardCenter,
    wallet: seller,
    tokenAccount: associatedTokenAccount,
    metadata: metadata,
    auctionHouse: auctionHouseAddress,
  };

  const args: UpdateListingInstructionArgs = {
    updateListingParams: {
      newPrice: buyerPrice,
    },
  };

  const instruction = createUpdateListingInstruction(accounts, args);

  return [instruction];
};
