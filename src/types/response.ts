import {
  AddressLookupTableAccount,
  TransactionInstruction,
} from '@solana/web3.js';

/**
 * Response for nightmarket actions
 * 
 * It can be used to build a transaction or a versioned transaction
 */
export type TxRes = {
  /** a list of the instructions in the transaction */
  instructions: TransactionInstruction[];
  /** if error occurs, the error message is shown by this field */
  err: string | null;
  /** a list of the address look-up table accounts */
  ltAccounts?: AddressLookupTableAccount[];
};

/**
 * NFT listing information
 */
export type Listing = {
  /** seller address */
  seller: string;
  /** SOL price */
  price: number;
  /** signature of the listing transaction */
  signature: string;
  /** timestamp of the listing */
  blockTimestamp: number;
};

/**
 * NFT offer information
 */
export type Offer = {
  /** buyer address */
  buyer: string;
  /** seller address */
  seller: string | null;
  /** SOL price */
  price: number;
  /** signature of the offer transaction */
  signature: string;
  /** timestamp of the offer */
  blockTimestamp: number;
}