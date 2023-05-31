// @ts-nocheck
import { NightmarketClient, TxRes } from '@motleylabs/mtly-nightmarket';
import { WalletContextState } from '@solana/wallet-adapter-react';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { queueVersionedTransactionSign, reduceSettledPromise } from './transactions';

export const createListing = async ({
  connection,
  wallet,
  mint,
  amount,
}: {
  connection: Connection;
  wallet: WalletContextState;
  mint: PublicKey;
  amount: number;
}): Promise<void> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw 'wallet is not connected';
  }

  const nightmarketClient = new NightmarketClient('YOUR RPC ENDPOINT');
  const txRes: TxRes = await nightmarketClient.CreateListing(mint, amount, wallet.publicKey);

  if (!!txRes.err) {
    throw txRes.err;
  }

  const { blockhash } = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: txRes.instructions,
  }).compileToV0Message(txRes.ltAccounts);
  const transactionV0 = new VersionedTransaction(messageV0);

  const pendingSigned = await queueVersionedTransactionSign({
    transactions: [transactionV0],
    signAllTransactions: wallet.signAllTransactions,
    signTransaction: wallet.signTransaction,
    connection,
    txInterval: 500,
  });

  const settledSignedTxs = reduceSettledPromise(pendingSigned);

  if (settledSignedTxs.rejected.length > 0) {
    throw settledSignedTxs.rejected[0];
  }

  if (settledSignedTxs.fulfilled.length > 0) {
    return;
  }
};

export const updateListing = async ({
  connection,
  wallet,
  mint,
  amount,
}: {
  connection: Connection;
  wallet: WalletContextState;
  mint: PublicKey;
  amount: number;
}): Promise<void> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw 'wallet is not connected';
  }

  const nightmarketClient = new NightmarketClient(process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? '');
  const txRes: TxRes = await nightmarketClient.UpdateListing(mint, amount, wallet.publicKey);

  if (!!txRes.err) {
    throw txRes.err;
  }

  const tx = new Transaction();
  tx.add(...txRes.instructions);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signedTx = await wallet.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  if (!signature) {
    return;
  }
  await connection.confirmTransaction(
    {
      blockhash,
      lastValidBlockHeight,
      signature,
    },
    'confirmed'
  );
};
