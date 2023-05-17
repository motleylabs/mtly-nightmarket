import type { PayoutOperation } from '@motleylabs/mtly-reward-center';
import type { PublicKey } from '@solana/web3.js';

export type AuctionHouse = {
  address: string;
  authority: string;
  auctionHouseFeeAccount: string;
  auctionHouseTreasury: string;
  sellerFeeBasisPoints: number;
  treasuryMint: string;
  rewardCenter: RewardCenter | null;
};

export type RewardCenter = {
  address: PublicKey;
  tokenMint: PublicKey;
  sellerRewardPayoutBasisPoints: number;
  payoutNumeral: number;
  mathematicalOperand: PayoutOperation;
};
