import { AddressLookupTableAccount, TransactionInstruction } from '@solana/web3.js';

/**
 * Night Market action object.
 *
 * Contains the instructions and error message of a transaction.
 */
export type Action = {
  /** A list of the instructions in the transaction */
  instructions: TransactionInstruction[];
  /** An error message, if encountered */
  err: string | null;
  /** A list of ALT accounts required by instructions */
  altAccounts?: AddressLookupTableAccount[];
};

/**
 * NFT listing details
 */
export type Listing = {
  /** Seller address */
  seller: string;
  /** SOL price */
  price: number;
  /** Signature of the listing transaction */
  signature: string;
  /** Timestamp of the listing transaction */
  blockTimestamp: number;
  /** Auction House (Marketplace) program */
  auctionHouseProgram: string;
  /** Auction House (Marketplace) instance */
  auctionHouseAddress: string;
};

/**
 * NFT offer details
 */
export type Offer = {
  /** Buyer address */
  buyer: string;
  /** Seller address */
  seller: string | null;
  /** SOL price */
  price: number;
  /** Signature of the offer transaction */
  signature: string;
  /** Timestamp of the offer transaction */
  blockTimestamp: number;
  /** Auction House (Marketplace) program */
  auctionHouseProgram: string;
  /** Auction House (Marketplace) instance */
  auctionHouseAddress: string;
};
