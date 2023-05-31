import {
  CloseOfferInstructionAccounts,
  CloseOfferInstructionArgs,
  createCloseOfferInstruction,
} from '@motleylabs/mtly-reward-center';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { AuctionHouse } from '../../types';
import { AuctionHouseProgram, getMetadataAccount, toLamports } from '../../utils';
import { RewardCenterProgram } from '../modules';

export const getCloseOfferInstructions = async ({
  connection,
  auctionHouse,
  mint,
  price,
  seller,
  buyer,
}: {
  connection: Connection;
  auctionHouse: AuctionHouse;
  mint: PublicKey;
  price: number;
  seller: PublicKey;
  buyer: PublicKey;
}): Promise<TransactionInstruction[]> => {
  const auctionHouseAddress = new PublicKey(auctionHouse.address);
  const buyerPrice = toLamports(price);
  const authority = new PublicKey(auctionHouse.authority);
  const ahFeeAcc = new PublicKey(auctionHouse.auctionHouseFeeAccount);
  const treasuryMint = new PublicKey(auctionHouse.treasuryMint);
  const metadata = getMetadataAccount(mint);
  const associatedTokenAcc = getAssociatedTokenAddressSync(mint, seller);

  const [buyerTradeState] = AuctionHouseProgram.findPublicBidTradeStateAddress(
    buyer,
    auctionHouseAddress,
    treasuryMint,
    mint,
    buyerPrice,
    1
  );

  const [escrowPaymentAcc, escrowPaymentBump] = AuctionHouseProgram.findEscrowPaymentAccountAddress(
    auctionHouseAddress,
    buyer
  );

  const [rewardCenter] = RewardCenterProgram.findRewardCenterAddress(auctionHouseAddress);

  const [rewardsOffer] = RewardCenterProgram.findOfferAddress(buyer, metadata, rewardCenter);

  const [auctioneer] = await RewardCenterProgram.findAuctioneerAddress(
    auctionHouseAddress,
    rewardCenter
  );

  const accounts: CloseOfferInstructionAccounts = {
    wallet: buyer,
    offer: rewardsOffer,
    treasuryMint,
    tokenAccount: associatedTokenAcc,
    receiptAccount: buyer,
    escrowPaymentAccount: escrowPaymentAcc,
    metadata,
    tokenMint: mint,
    authority,
    rewardCenter,
    auctionHouse: auctionHouseAddress,
    auctionHouseFeeAccount: ahFeeAcc,
    tradeState: buyerTradeState,
    ahAuctioneerPda: auctioneer,
    auctionHouseProgram: AuctionHouseProgram.PUBKEY,
  };

  const args: CloseOfferInstructionArgs = {
    closeOfferParams: {
      escrowPaymentBump,
    },
  };

  return [createCloseOfferInstruction(accounts, args)];
};
