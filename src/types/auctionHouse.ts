import type { PayoutOperation } from '@motleylabs/mtly-reward-center';

export type AuctionHouse = {
  address: string;
  program: string;
  authority: string;
  auctionHouseFeeAccount: string;
  auctionHouseTreasury: string;
  sellerFeeBasisPoints: number;
  treasuryMint: string;
  rewardCenter: RewardCenter | null;
};

export type RewardCenter = {
  address: string;
  tokenMint: string;
  sellerRewardPayoutBasisPoints: number;
  payoutNumeral: number;
  mathematicalOperand: PayoutOperation;
};
