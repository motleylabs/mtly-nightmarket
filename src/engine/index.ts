import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Config, Listing, Offer, TxRes, defaultConfig } from '../types';
import {
  getCloseListingInstructions,
  getCreateListingInstructions,
  getUpdateListingInstructions,
  getCreateOfferInstructions,
  getCloseOfferInstructions,
  getAcceptOfferInstructions,
  getBuyListingInstructions,
} from './lib';
import axios from 'axios';

export class NightmarketClient {
  private config: Config;

  /**
   * 
   * @param endpoint - A string param for the solana RPC endpoint 
   */
  constructor(endpoint?: string) {
    this.config = defaultConfig;
    if (!!endpoint) {
      this.config.connection = new Connection(endpoint);
    }
  }

  /**
   * Gets a listing information for NFT
   * @param mint - A public key of the NFT
   * @returns {Listing | null} - A listing data
   */
  public async GetListing(
    mint: PublicKey
  ): Promise<Listing | null> {
    try {
      const { data: { latestListing: listing } } = await axios.get(`${this.config.apiEndpoint}/nfts/${mint.toBase58()}`);
      return {
        seller: listing.userAddress,
        price: Number(listing.price) / LAMPORTS_PER_SOL,
        signature: listing.signature,
        blockTimestamp: listing.blockTimestamp
      };
    } catch(_) {
      return null;
    }
  }

  /**
   * Gets the offers for NFT
   * @param mint - A public key of the NFT
   * @returns {Offer[]} - A list of NFT offers
   */
    public async GetOffers(
      mint: PublicKey
    ): Promise<Offer[]> {
      try {
        const { data } = await axios.get(`${this.config.apiEndpoint}/nfts/offers?address=${mint.toBase58()}`);
        return data.map((item: any) => ({
          buyer: item.buyer,
          seller: item.seller,
          price: Number(item.price) / LAMPORTS_PER_SOL,
          signature: item.signature,
          blockTimestamp: item.blockTimestamp
        }))
      } catch(_) {
        return [];
      }
    }

  /**
   * Creates a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of listing
   * @param seller - A public key for the NFT owner
   * @param budgetIxNeeded - A flag to indicate if the budget instruction is needed
   * @returns {TxRes} - A response of transaction data
   */
  public async CreateListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    budgetIxNeeded = true,
  ): Promise<TxRes> {
    try {
      const ixs = await getCreateListingInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
        budgetIxNeeded,
      });
      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(new PublicKey(this.config.addressLookupTable))
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
   * Updates a listing for NFT
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of listing
   * @param seller - A public key for the NFT owner
   * @returns {TxRes} - A response of transaction data
   */
  public async UpdateListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = getUpdateListingInstructions({
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
   * @returns {TxRes} - A response of transaction data
   */
  public async CloseListing(
    mint: PublicKey,
    seller: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getCloseListingInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        seller,
      });
      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(new PublicKey(this.config.addressLookupTable))
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
   * Creates an offer for buying a listed NFT
   * @param mint - A public key for the listed NFT
   * @param amount - A SOL price of offer
   * @param seller - A public key for the NFT owner
   * @param buyer - A public key for buyer
   * @returns {TxRes} - A response of transaction data
   */
  public async CreateOffer(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    buyer: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getCreateOfferInstructions({
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
   * @returns {TxRes} - A response of transaction data
   */
  public async CloseOffer(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    buyer: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getCloseOfferInstructions({
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
   * @returns {TxRes} - A response of transaction data
   * 
   * It can be used to construct a versioned transaction like the following.
   * ```ts
   * const nmClient = new NightmarketClient("YOUR PRC ENDPOINT");
   * 
   * const txRes = await nmClient.AcceptOffer(mint, amount, seller, buyer);
   * if (!!txRes.err) {
   *    throw txRes.err;
   * }
   * 
   * const { blockhash } = await connection.getLatestBlockhash();
   * const messageV0 = new TransactionMessage({
   *   payerKey: publicKey,
   *   recentBlockhash: blockhash,
   *   instructions: txRes.instructions,
   * }).compileToV0Message(txRes.ltAccounts);
   * 
   * const transactionV0 = new VersionedTransaction(messageV0);
   * ```
   */
  public async AcceptOffer(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    buyer: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getAcceptOfferInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
        buyer,
      });
      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(new PublicKey(this.config.addressLookupTable))
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
   * @returns {TxRes} - A response of transaction data
   */
  public async BuyListing(
    mint: PublicKey,
    amount: number,
    seller: PublicKey,
    buyer: PublicKey,
  ): Promise<TxRes> {
    try {
      const ixs = await getBuyListingInstructions({
        connection: this.config.connection,
        auctionHouse: this.config.auctionHouse,
        mint,
        amount,
        seller,
        buyer,
      });
      const lookupTableAccount = await this.config.connection
        .getAddressLookupTable(new PublicKey(this.config.addressLookupTable))
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
