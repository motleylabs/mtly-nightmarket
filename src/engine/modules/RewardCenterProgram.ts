import { PublicKey } from '@solana/web3.js';

import { BN } from 'bn.js';

import { AuctionHouseProgram } from '../../utils/mtly-house';

const REWARD_CENTER_PROGRAM = new PublicKey(
  'rwdD3F6CgoCAoVaxcitXAeWRjQdiGc5AVABKCpQSMfd',
);

export class RewardCenterProgram {
  static PUBKEY = REWARD_CENTER_PROGRAM;

  static findRewardCenterAddress(auctionHouse: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('reward_center', 'utf8'), auctionHouse.toBuffer()],
      REWARD_CENTER_PROGRAM,
    );
  }

  static findListingAddress(
    seller: PublicKey,
    metadata: PublicKey,
    rewardCenter: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('listing', 'utf8'),
        seller.toBuffer(),
        metadata.toBuffer(),
        rewardCenter.toBuffer(),
      ],
      REWARD_CENTER_PROGRAM,
    );
  }

  static findOfferAddress(
    buyer: PublicKey,
    metadata: PublicKey,
    rewardCenter: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('offer'),
        buyer.toBuffer(),
        metadata.toBuffer(),
        rewardCenter.toBuffer(),
      ],
      REWARD_CENTER_PROGRAM,
    );
  }

  static findAuctioneerAddress(
    auctionHouse: PublicKey,
    rewardCenter: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('auctioneer', 'utf8'),
        auctionHouse.toBuffer(),
        rewardCenter.toBuffer(),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findAuctioneerTradeStateAddress(
    wallet: PublicKey,
    auctionHouse: PublicKey,
    tokenAccount: PublicKey,
    treasuryMint: PublicKey,
    tokenMint: PublicKey,
    tokenSize: number,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('auction_house', 'utf8'),
        wallet.toBuffer(),
        auctionHouse.toBuffer(),
        tokenAccount.toBuffer(),
        treasuryMint.toBuffer(),
        tokenMint.toBuffer(),
        new BN('18446744073709551615').toArrayLike(Buffer, 'le', 8),
        new BN(tokenSize).toArrayLike(Buffer, 'le', 8),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findPurchaseTicketAddress(
    listing: PublicKey,
    offer: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('purchase_ticket'), listing.toBuffer(), offer.toBuffer()],
      REWARD_CENTER_PROGRAM,
    );
  }
}
