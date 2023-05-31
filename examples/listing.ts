// @ts-nocheck
import { Action, NightmarketClient } from '@motleylabs/mtly-nightmarket';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

import {
  queueVersionedTransactionSign,
  reduceSettledPromise,
  sendTransactionWithRetry,
} from './transactions';

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

  // get the night market client instance
  const nightmarketClient = new NightmarketClient('YOUR RPC ENDPOINT');

  // get the transaction information for listing the mint
  const txRes: Action = await nightmarketClient.CreateListing(mint, amount, wallet.publicKey);

  if (!!txRes.err) {
    throw txRes.err;
  }

  // build a versioned transaction
  const { blockhash } = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: txRes.instructions,
  }).compileToV0Message(txRes.ltAccounts);
  const transactionV0 = new VersionedTransaction(messageV0);

  // send and confirm the versioned transaction
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

  // get the night market client instance
  const nightmarketClient = new NightmarketClient(process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? '');

  // get the transaction information for updating the listing
  const txRes: Action = await nightmarketClient.UpdateListing(mint, amount, wallet.publicKey);

  if (!!txRes.err) {
    throw txRes.err;
  }

  // build, send, and confirm the transaction
  const { txid } = await sendTransactionWithRetry(connection, wallet, txRes.insructions, []);
  console.log(`Update listing signature: ${txid}`);
};
