import { PROGRAM_ID } from '@motleylabs/mtly-auction-house';
import { PublicKey } from '@solana/web3.js';

import BN from 'bn.js';

export class AuctionHouseProgram {
  static readonly PREFIX = 'auction_house';
  static readonly FEE_PAYER = 'fee_payer';
  static readonly TREASURY = 'treasury';
  static readonly SIGNER = 'signer';
  static readonly LISTINE_RECEIPT = 'listing_receipt';
  static readonly BID_RECEIPT = 'bid_receipt';
  static readonly PURCHASE_RECEIPT = 'purchase_receipt';

  static readonly PUBKEY = new PublicKey(PROGRAM_ID);

  static readonly TOKEN_PROGRAM_ID = new PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  );
  static readonly SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  );

  static findAssociatedTokenAccountAddress(
    mint: PublicKey,
    wallet: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        wallet.toBuffer(),
        AuctionHouseProgram.TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      AuctionHouseProgram.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    );
  }

  static findAuctionHouseAddress(
    creator: PublicKey,
    treasuryMint: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.PREFIX, 'utf8'),
        creator.toBuffer(),
        treasuryMint.toBuffer(),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findAuctionHouseProgramAsSignerAddress(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.PREFIX, 'utf8'),
        Buffer.from(AuctionHouseProgram.SIGNER, 'utf8'),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findAuctionHouseTreasuryAddress(
    auctionHouse: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.PREFIX, 'utf8'),
        auctionHouse.toBuffer(),
        Buffer.from(AuctionHouseProgram.TREASURY, 'utf8'),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findEscrowPaymentAccountAddress(
    auctionHouse: PublicKey,
    wallet: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.PREFIX, 'utf8'),
        auctionHouse.toBuffer(),
        wallet.toBuffer(),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findTradeStateAddress(
    wallet: PublicKey,
    auctionHouse: PublicKey,
    tokenAccount: PublicKey,
    treasuryMint: PublicKey,
    tokenMint: PublicKey,
    price: number,
    tokenSize: number,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.PREFIX, 'utf8'),
        wallet.toBuffer(),
        auctionHouse.toBuffer(),
        tokenAccount.toBuffer(),
        treasuryMint.toBuffer(),
        tokenMint.toBuffer(),
        new BN(price).toArrayLike(Buffer, 'le', 8),
        new BN(tokenSize).toArrayLike(Buffer, 'le', 8),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findPublicBidTradeStateAddress(
    wallet: PublicKey,
    auctionHouse: PublicKey,
    treasuryMint: PublicKey,
    tokenMint: PublicKey,
    price: number,
    tokenSize: number,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.PREFIX, 'utf8'),
        wallet.toBuffer(),
        auctionHouse.toBuffer(),
        treasuryMint.toBuffer(),
        tokenMint.toBuffer(),
        new BN(price).toArrayLike(Buffer, 'le', 8),
        new BN(tokenSize).toArrayLike(Buffer, 'le', 8),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findAuctionHouseFeeAddress(auctionHouse: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.PREFIX, 'utf8'),
        auctionHouse.toBuffer(),
        Buffer.from(AuctionHouseProgram.FEE_PAYER, 'utf8'),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findListingReceiptAddress(sellerTradeState: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.LISTINE_RECEIPT, 'utf8'),
        sellerTradeState.toBuffer(),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findBidReceiptAddress(buyerTradeState: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.BID_RECEIPT, 'utf8'),
        buyerTradeState.toBuffer(),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }

  static findPurchaseReceiptAddress(
    sellerTradeState: PublicKey,
    buyerTradeState: PublicKey,
  ) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(AuctionHouseProgram.PURCHASE_RECEIPT, 'utf8'),
        sellerTradeState.toBuffer(),
        buyerTradeState.toBuffer(),
      ],
      AuctionHouseProgram.PUBKEY,
    );
  }
}
