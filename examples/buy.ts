// @ts-nocheck
import { Action, Listing, NightmarketClient } from '@motleylabs/mtly-nightmarket';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

import { queueVersionedTransactionSign, reduceSettledPromise } from './transactions';

export const buyListing = async ({
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

  // get the listing information for the mint
  const listing: Listing = await nightmarketClient.GetListing(mint);

  if (!listing || !nightmarketClient.IsLocalListing(listing)) {
    throw 'NFT is not listed on the night market';
  }

  // get the transaction information for buying the NFT
  const txRes: Action = await nightmarketClient.BuyListing(
    mint,
    listing.price,
    listing.seller,
    wallet.publicKey
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
  }).compileToV0Message(txRes.altAccounts);
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
