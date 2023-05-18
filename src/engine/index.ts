import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Config, defaultConfig } from 'src/types';
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
   * @returns {TransactionInstruction[]} - Transaction instructions
   */
  public async CreateListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    isPNFT = true,
  ): Promise<TransactionInstruction[]> {
    return await getCreateListingIxs({
      connection: this.config.connection,
      auctionHouse: this.config.auctionHouse,
      mint,
      amount,
      seller,
    });
  }

  /**
   * Updates a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of listing
   * @param seller - A public key for the NFT owner
   * @returns {TransactionInstruction[]} - Transaction instructions
   */
  public async UpdateListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
  ): Promise<TransactionInstruction[]> {
    return getUpdateListingIxs({
      auctionHouse: this.config.auctionHouse,
      mint,
      amount,
      seller,
    });
  }

  /**
   * Closes a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param seller - A public key for the NFT owner
   * @param isPNFT - A boolean param that shows whether the NFT is programmable or not
   * @returns {TransactionInstruction[]} - Transaction instructions
   */
  public async CloseListing(
    mint: PublicKey,
    seller: PublicKey,
    isPNFT = true,
  ): Promise<TransactionInstruction[]> {
    return getCloseListingIxs({
      connection: this.config.connection,
      auctionHouse: this.config.auctionHouse,
      mint,
      seller,
      isPNFT,
    });
  }
}
