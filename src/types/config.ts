import { Connection, PublicKey } from '@solana/web3.js';
import { AuctionHouse } from './auctionHouse';

export type Config = {
  auctionHouse: AuctionHouse;
  connection: Connection;
  addressLookupTable: PublicKey;
};

export const defaultConfig: Config = {
  auctionHouse: {
    address: 'FVmjRUm2ssXi5vZUhwzB2HfXzTVzvE73x3f5NmTtZ7C8',
    auctionHouseFeeAccount: '9AhUsSTdzZzi6MJcFGQkZam4zYQSNT1Lqz83P3viyqJk',
    auctionHouseTreasury: 'Ad7toYmfWGMYeB3gsDXTPFRgUhkNwvimZxC69nzkqJK7',
    authority: 'MtLyd5Jf2V3YbkUyRPR4VSUaa1MYw38c2U6dCwg4WUv',
    rewardCenter: {
      address: new PublicKey('DzDX1vvRamMeAdcKCdsekcqeqLgRosF7NEZcDwWFWLRk'),
      mathematicalOperand: 0,
      payoutNumeral: 0,
      sellerRewardPayoutBasisPoints: 0,
      tokenMint: new PublicKey('SAUCEvCGBkPPDPsiSWG5heGNMw68mc6EMuyGYwAfgaD'),
    },
    sellerFeeBasisPoints: 100,
    treasuryMint: 'So11111111111111111111111111111111111111112',
  },
  connection: new Connection('https://api.mainnet-beta.solana.com'),
  addressLookupTable: new PublicKey(
    'HQma5N1kPpYiQBMUx4CqDSuUyjCzNHhvRtRz1qTBNtNp',
  ),
};
