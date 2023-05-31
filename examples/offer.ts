// @ts-nocheck
import { Action, NightmarketClient, Offer } from '@motleylabs/mtly-nightmarket';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

import { queueVersionedTransactionSign, reduceSettledPromise } from './transactions';

export const acceptOffer = async ({
  connection,
  wallet,
  mint,
}: {
  connection: Connection;
  wallet: WalletContextState;
  mint: PublicKey;
}): Promise<void> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw 'wallet is not connected';
  }

  // get the night market client instance
  const nightmarketClient = new NightmarketClient('YOUR RPC ENDPOINT');

  // get the offers for the mint that are sorted by the offer price
  const offers = nightmarketClient.GetOffers(mint).sort((a: Offer, b: Offer) => b.price - a.price);

  if (offers.length === 0) {
    throw 'no offers';
  }

  // get the transaction information for accepting the highest offer
  const txRes: Action = await nightmarketClient.AcceptOffer(
    mint,
    offers[0].price,
    wallet.publicKey,
    offers[0].buyer
  );

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

  // send and confirm transaction
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
