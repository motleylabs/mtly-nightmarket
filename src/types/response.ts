import {
  AddressLookupTableAccount,
  TransactionInstruction,
} from '@solana/web3.js';

export type TxRes = {
  instructions: TransactionInstruction[];
  err: string | null;
  ltAccounts?: AddressLookupTableAccount[];
};
