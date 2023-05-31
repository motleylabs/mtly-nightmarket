import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import axios from 'axios';

import { Action, Config, Listing, Offer, defaultConfig } from '../types';
import {
  getAcceptOfferInstructions,
  getBuyListingInstructions,
  getCloseListingInstructions,
  getCloseOfferInstructions,
  getCreateListingInstructions,
  getCreateOfferInstructions,
  getUpdateListingInstructions,
} from './lib';

export class NightmarketClient {
  private config: Config;

  /**
   *
   * @param endpoint - Solana RPC endpoint URL
   */
  constructor(endpoint?: string) {
    this.config = defaultConfig;
    if (!!endpoint) {
      this.config.connection = new Connection(endpoint);
    }
  }

  /**
   * Get the listing details for a NFT
   * @param mint - Public key of the NFT
   * @returns {Listing | null} - NFT listing details
   * 
   * This function can be used to fetch the listing information like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   * const listing = await nmClient.GetListing(mint);
   */
  public async GetListing(mint: PublicKey): Promise<Listing | null> {
    try {
      const {
        data: { latestListing: listing },
      } = await axios.get(`${this.config.apiEndpoint}/nfts/${mint.toBase58()}`);
      return {
        seller: listing.userAddress,
        price: Number(listing.price) / LAMPORTS_PER_SOL,
        signature: listing.signature,
        blockTimestamp: listing.blockTimestamp,
        auctionHouseProgram: listing.auctionHouseProgram,
        auctionHouseAddress: listing.auctionHouseAddress,
      };
    } catch (_) {
      return null;
    }
  }

  /**
   * Get offers for a NFT
   * @param mint - Public key of the NFT
   * @returns {Offer[]} - A list of NFT offers
   * 
   * This function can be used to fetch the offers information like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   * const offers = await nmClient.GetOffers(mint);
   */
  public async GetOffers(mint: PublicKey): Promise<Offer[]> {
    try {
      const { data } = await axios.get(
        `${this.config.apiEndpoint}/nfts/offers?address=${mint.toBase58()}`
      );
      return data.map((item: any) => ({
        buyer: item.buyer,
        seller: item.seller,
        price: Number(item.price) / LAMPORTS_PER_SOL,
        signature: item.signature,
        blockTimestamp: item.blockTimestamp,
        auctionHouseProgram: item.martketplaceProgramAddress,
        auctionHouseAddress: item.auctionHouseAddress,
      }));
    } catch (_) {
      return [];
    }
  }

  /**
   * Create a listing for a NFT
   * @param mint - Public key for the NFT to list
   * @param price - SOL price of listing
   * @param seller - Public key for the seller
   * @returns {Action} - Night Market action object
   * 
   * The function can be used to construct a versioned transaction like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   *
   * const createListingAction = await nmClient.CreateListing(mint, price, seller);
   * if (!!createListingAction.err) {
   *    throw createListingAction.err;
   * }
   *
   * const { blockhash } = await connection.getLatestBlockhash();
   * const messageV0 = new TransactionMessage({
   *   payerKey: seller,
   *   recentBlockhash: blockhash,
   *   instructions: createListingAction.instructions,
   * }).compileToV0Message(createListingAction.altAccounts);
   *
   * const transactionV0 = new VersionedTransaction(messageV0);
   * ```
   */
  public async CreateListing(mint: PublicKey, price: number, seller: PublicKey): Promise<Action> {
    try {
      const ixs = await getCreateListingInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        price,
        seller,
      });

      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(new PublicKey(this.config.addressLookupTable))
        .then((res) => res.value);

      return {
        instructions: ixs,
        altAccounts: !!lookupTableAccount ? [lookupTableAccount] : undefined,
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
   * Update a listing for a NFT
   * @param mint - Public key for the listed NFT
   * @param price - Updated SOL price of the NFT
   * @param seller - Public key for the seller
   * @returns {Action} - Night Market action object
   * 
   * The function can be used to construct a transaction like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   *
   * const updateListingAction = await nmClient.UpdateListing(mint, price, seller);
   * if (!!updateListingAction.err) {
   *    throw updateListingAction.err;
   * }
   *
   * const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
   * const tx = new Transaction();
   * 
   * tx.add(...updateListingAction.instructions);
   * tx.recentBlockhash = blockhash;
   * tx.feePayer = seller;
   * tx.lastValidBlockHeight = lastValidBlockHeight; 
   * ```
   */
  public async UpdateListing(mint: PublicKey, price: number, seller: PublicKey): Promise<Action> {
    try {
      const ixs = getUpdateListingInstructions({
        auctionHouse: this.config.auctionHouse,
        mint,
        price,
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
   * Close a listing for a NFT
   * @param mint - Public key for the listed NFT
   * @param seller - Public key for the seller
   * @returns {Action} - Night Market action object
   * 
   * The function can be used to construct a versioned transaction like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   *
   * const closeListingAction = await nmClient.CloseListing(mint, seller);
   * if (!!closeListingAction.err) {
   *    throw closeListingAction.err;
   * }
   *
   * const { blockhash } = await connection.getLatestBlockhash();
   * const messageV0 = new TransactionMessage({
   *   payerKey: seller,
   *   recentBlockhash: blockhash,
   *   instructions: closeListingAction.instructions,
   * }).compileToV0Message(closeListingAction.altAccounts);
   *
   * const transactionV0 = new VersionedTransaction(messageV0);
   */
  public async CloseListing(mint: PublicKey, seller: PublicKey): Promise<Action> {
    try {
      const ixs = await getCloseListingInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        seller,
      });

      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(new PublicKey(this.config.addressLookupTable))
        .then((res) => res.value);

      return {
        instructions: ixs,
        altAccounts: !!lookupTableAccount ? [lookupTableAccount] : undefined,
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
   * Create an offer for buying a NFT
   * @param mint - Public key for the NFT
   * @param price - SOL price of the offer
   * @param seller - Public key for the NFT owner
   * @param buyer - Public key for the buyer
   * @returns {Action} - Night Market action object
   * 
   * The function can be used to construct a transaction like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   *
   * const createOfferAction = await nmClient.CreateOffer(mint, price, seller, buyer);
   * if (!!createOfferAction.err) {
   *    throw createOfferAction.err;
   * }
   *
   * const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
   * const tx = new Transaction();
   * 
   * tx.add(...createOfferAction.instructions);
   * tx.recentBlockhash = blockhash;
   * tx.feePayer = buyer;
   * tx.lastValidBlockHeight = lastValidBlockHeight; 
   * ```
   */
  public async CreateOffer(
    mint: PublicKey,
    price: number,
    seller: PublicKey,
    buyer: PublicKey
  ): Promise<Action> {
    try {
      const ixs = await getCreateOfferInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        price,
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
   * Close an offer
   * @param mint - Public key for the NFT
   * @param price - SOL price of offer
   * @param seller - Public key for the seller
   * @param buyer - Public key for the buyer
   * @returns {Action} - Night Market action object
   * 
   * The function can be used to construct a transaction like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   *
   * const closeOfferAction = await nmClient.CloseOffer(mint, price, seller, buyer);
   * if (!!closeOfferAction.err) {
   *    throw closeOfferAction.err;
   * }
   *
   * const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
   * const tx = new Transaction();
   * 
   * tx.add(...closeOfferAction.instructions);
   * tx.recentBlockhash = blockhash;
   * tx.feePayer = buyer;
   * tx.lastValidBlockHeight = lastValidBlockHeight; 
   * ```
   */
  public async CloseOffer(
    mint: PublicKey,
    price: number,
    seller: PublicKey,
    buyer: PublicKey
  ): Promise<Action> {
    try {
      const ixs = await getCloseOfferInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        price,
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
   * @param mint - Public key for the listed NFT
   * @param price - SOL price for offer
   * @param seller - Public key for the seller
   * @param buyer - Public key for the buyer
   * @returns {Action} - Night Market action object
   *
   * The function can be used to construct a versioned transaction like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   *
   * const acceptAction = await nmClient.AcceptOffer(mint, price, seller, buyer);
   * if (!!acceptAction.err) {
   *    throw acceptAction.err;
   * }
   *
   * const { blockhash } = await connection.getLatestBlockhash();
   * const messageV0 = new TransactionMessage({
   *   payerKey: seller,
   *   recentBlockhash: blockhash,
   *   instructions: acceptAction.instructions,
   * }).compileToV0Message(acceptAction.altAccounts);
   *
   * const transactionV0 = new VersionedTransaction(messageV0);
   * ```
   */
  public async AcceptOffer(
    mint: PublicKey,
    price: number,
    seller: PublicKey,
    buyer: PublicKey
  ): Promise<Action> {
    try {
      const ixs = await getAcceptOfferInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        price,
        seller,
        buyer,
      });

      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(new PublicKey(this.config.addressLookupTable))
        .then((res) => res.value);

      return {
        instructions: ixs,
        altAccounts: !!lookupTableAccount ? [lookupTableAccount] : undefined,
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
   * Buy a NFT via listing.
   * Currently only support Night Market listings.
   * @param mint - Public key for the listed NFT
   * @param price - SOL price of the listing
   * @param seller - Public key for the seller
   * @param buyer - Public key for the buyer
   * @returns {Action} - Night Market action object
   * 
   * The function can be used to construct a versioned transaction like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR RPC ENDPOINT");
   *
   * const buyListingAction = await nmClient.BuyListing(mint, price, seller, buyer);
   * if (!!buyListingAction.err) {
   *    throw buyListingAction.err;
   * }
   *
   * const { blockhash } = await connection.getLatestBlockhash();
   * const messageV0 = new TransactionMessage({
   *   payerKey: buyer,
   *   recentBlockhash: blockhash,
   *   instructions: buyListingAction.instructions,
   * }).compileToV0Message(buyListingAction.altAccounts);
   *
   * const transactionV0 = new VersionedTransaction(messageV0);
   * ```
   */
  public async BuyListing(
    mint: PublicKey,
    price: number,
    seller: PublicKey,
    buyer: PublicKey
  ): Promise<Action> {
    try {
      const ixs = await getBuyListingInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        price,
        seller,
        buyer,
      });

      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(new PublicKey(this.config.addressLookupTable))
        .then((res) => res.value);

      return {
        instructions: ixs,
        altAccounts: !!lookupTableAccount ? [lookupTableAccount] : undefined,
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
