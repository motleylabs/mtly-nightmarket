import { Connection, PublicKey } from '@solana/web3.js';
import { Config, TxRes, defaultConfig } from '../types';
import {
  getCloseListingIxs,
  getCreateListingIxs,
  getUpdateListingIxs,
} from './lib';
import { getCreateOfferIxs } from './lib/createOffer';
import { getCloseOfferIxs } from './lib/closeOffer';
import { getAcceptOfferIxs } from './lib/acceptOffer';
import { getBuyListingIxs } from './lib/buyListing';

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
   * @param budgetIxNeeded - A flag to indicate if the budget instruction is needed
   * @returns {TxRes} - Response
   */
  public async CreateListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    budgetIxNeeded = true,
  ): Promise<TxRes> {
    try {
      const ixs = await getCreateListingIxs({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
        budgetIxNeeded,
      });
      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(this.config.addressLookupTable)
        .then(res => res.value);

      return {
        instructions: ixs,
        err: null,
        ltAccounts: !!lookupTableAccount ? [lookupTableAccount] : undefined,
      };
    } catch (e) {
      return {
        instructions: [],
        err: e as string,
      };
    }
  }

  /**
   * Updates a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of listing
   * @param seller - A public key for the NFT owner
   * @returns {TxRes} - Response
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
        instructions: ixs,
        err: null,
      };
    } catch (e) {
      return {
        instructions: [],
        err: e as string,
      };
    }
  }

  /**
   * Closes a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param seller - A public key for the NFT owner
   * @returns {TxRes} - Response
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
        instructions: ixs,
        err: null,
      };
    } catch (e) {
      return {
        instructions: [],
        err: e as string,
      };
    }
  }

  /**
   * Creates an offer for buying a listed NFT
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of offer
   * @param seller - A public key for the NFT owner
   * @param buyer - A public key for buyer
   * @returns {TxRes} - Response
   */
  public async CreateOffer(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    buyer: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getCreateOfferIxs({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
        buyer,
      });
      return {
        instructions: ixs,
        err: null,
      };
    } catch (e) {
      return {
        instructions: [],
        err: e as string,
      };
    }
  }

  /**
   * Closes an offer
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of offer
   * @param seller - A public key for the NFT owner
   * @param buyer - A public key for buyer
   * @returns {TxRes} - Response
   */
  public async CloseOffer(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    buyer: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getCloseOfferIxs({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
        buyer,
      });
      return {
        instructions: ixs,
        err: null,
      };
    } catch (e) {
      return {
        instructions: [],
        err: e as string,
      };
    }
  }

  /**
   * Accept an offer
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of offer
   * @param seller - A public key for the NFT owner
   * @param buyer - A public key for buyer
   * @returns {TxRes} - Response
   */
  public async AcceptOffer(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    buyer: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getAcceptOfferIxs({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
        buyer,
      });
      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(this.config.addressLookupTable)
        .then(res => res.value);

      return {
        instructions: ixs,
        ltAccounts: !!lookupTableAccount ? [lookupTableAccount] : undefined,
        err: null,
      };
    } catch (e) {
      return {
        instructions: [],
        err: e as string,
      };
    }
  }

  /**
   * Buys an listing
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of offer
   * @param seller - A public key for the NFT owner
   * @param buyer - A public key for buyer
   * @returns {TxRes} - Response
   */
  public async BuyListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    buyer: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getBuyListingIxs({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
        buyer,
      });
      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(this.config.addressLookupTable)
        .then(res => res.value);

      return {
        instructions: ixs,
        ltAccounts: !!lookupTableAccount ? [lookupTableAccount] : undefined,
        err: null,
      };
    } catch (e) {
      return {
        instructions: [],
        err: e as string,
      };
    }
  }
}
