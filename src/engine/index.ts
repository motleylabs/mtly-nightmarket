import { Connection, PublicKey } from '@solana/web3.js';
import { Config, TxRes, defaultConfig } from 'src/types';
import {
  getCloseListingIxs,
  getCreateListingIxs,
  getUpdateListingIxs,
} from './lib';

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
   * @returns {TxRes} - Transaction instructions
   */
  public async CreateListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getCreateListingIxs({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
      });
      return {
        ixs,
        err: null,
      };
    } catch (e) {
      return {
        ixs: [],
        err: e as string,
      };
    }
  }

  /**
   * Updates a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of listing
   * @param seller - A public key for the NFT owner
   * @returns {TxRes} - Transaction instructions
   */
  public async UpdateListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = getUpdateListingIxs({
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
      });
      return {
        ixs,
        err: null,
      };
    } catch (e) {
      return {
        ixs: [],
        err: e as string,
      };
    }
  }

  /**
   * Closes a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param seller - A public key for the NFT owner
   * @returns {TxRes} - Transaction instructions
   */
  public async CloseListing(
    mint: PublicKey,
    seller: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getCloseListingIxs({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        seller,
      });
      return {
        ixs,
        err: null,
      };
    } catch (e) {
      return {
        ixs: [],
        err: e as string,
      };
    }
  }
}
