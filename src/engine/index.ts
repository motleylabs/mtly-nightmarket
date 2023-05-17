import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Config, defaultConfig } from 'src/types';
import { getCreateListingTx } from './lib';

export class NightmarketClient {
  public config: Config;

  constructor(endpoint: string) {
    this.config = defaultConfig;
    if (!!endpoint) {
      this.config.connection = new Connection(endpoint);
    }
  }

  /**
   * Creates a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of listing
   * @param seller - A public key for the NFT owner
   * @param isPNFT - A boolean param that shows whether the NFT is programmable or not
   * @returns {VersionedTransaction} - A versioned transaction
   */
  public async CreateListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    isPNFT = true,
  ): Promise<VersionedTransaction> {
    return await getCreateListingTx({
      connection: this.config.connection,
      auctionHouse: this.config.auctionHouse,
      mint,
      amount,
      seller,
      isPNFT,
    });
  }
}
