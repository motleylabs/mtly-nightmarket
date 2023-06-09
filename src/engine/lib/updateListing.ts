import {
  UpdateListingInstructionAccounts,
  UpdateListingInstructionArgs,
  createUpdateListingInstruction,
} from '@motleylabs/mtly-reward-center';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { AuctionHouse } from '../../types';
import { AuctionHouseProgram, getMetadataAccount, toLamports } from '../../utils';
import { RewardCenterProgram } from '../modules';

export const getUpdateListingInstructions = ({
  auctionHouse,
  mint,
  price,
  seller,
}: {
  auctionHouse: AuctionHouse;
  mint: PublicKey;
  price: number;
  seller: PublicKey;
}): TransactionInstruction[] => {
  const auctionHouseAddress = new PublicKey(auctionHouse.address);
  const buyerPrice = toLamports(price);
  const metadata = getMetadataAccount(mint);

  const associatedTokenAccount = getAssociatedTokenAddressSync(mint, seller);

  const [rewardCenter] = RewardCenterProgram.findRewardCenterAddress(auctionHouseAddress);

  const [listingAddress] = RewardCenterProgram.findListingAddress(seller, metadata, rewardCenter);

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
