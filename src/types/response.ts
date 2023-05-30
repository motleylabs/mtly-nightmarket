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
  userAddress: string;
  price: string;
  signature: string;
  blockTimestamp: number;
  auctionHouseProgram: string;
  auctionHouseAddress: string;
};