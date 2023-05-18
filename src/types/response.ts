import {
  AddressLookupTableAccount,
  TransactionInstruction,
} from '@solana/web3.js';

export type TxRes = {
  ixs: TransactionInstruction[];
  err: string | null;
  ltAccount?: AddressLookupTableAccount | null;
};
