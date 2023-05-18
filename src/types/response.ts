import { TransactionInstruction } from '@solana/web3.js';

export type TxRes = {
  ixs: TransactionInstruction[] | null;
  err: string | null;
};
