// @ts-nocheck
import { NightmarketClient, TxRes, Offer } from '@motleylabs/mtly-nightmarket';
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { WalletContextState } from '@solana/wallet-adapter-react';
import { queueVersionedTransactionSign, reduceSettledPromise } from './transactions';

export const getOffers = async (mint: PublicKey): Promise<Offer[]> => {
    const nightmarketClient = new NightmarketClient('YOUR RPC ENDPOINT');
    return nightmarketClient.GetOffers(mint);
}

export const acceptOffer = async ({
    connection,
    wallet,
    mint, 
    buyer,
    amount
}:{
    connection: Connection,
    wallet: WalletContextState,
    mint: PublicKey,
    buyer: PublicKey,
    amount: number
}): Promise<void> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
        throw 'wallet is not connected';
    }

    const nightmarketClient = new NightmarketClient('YOUR RPC ENDPOINT');
    const txRes: TxRes = await nightmarketClient.AcceptOffer(mint, amount, wallet.publicKey, buyer);

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
}