import { Wallet } from '@project-serum/anchor';
import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  SignatureStatus,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';

const DEFAULT_TIMEOUT = 30000;

export const wait = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
  commitment: Commitment = 'recent',
  queryStatus = false
) {
  let done = false;
  let status: SignatureStatus | null = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  await new Promise((resolve, reject) => {
    (async () => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        reject(new Error('timeout'));
      }, timeout);
      try {
        subId = connection.onSignature(
          txid,
          (result, context) => {
            done = true;
            status = {
              err: result.err,
              slot: context.slot,
              confirmations: 0,
            };
            if (result.err) {
              // eslint-disable-next-line no-console
              console.log('Rejected via websocket', result.err);
              if (result.err === null) {
                resolve(result.err);
              } else {
                reject(result.err);
              }
            } else {
              // eslint-disable-next-line no-console
              console.log('Resolved via websocket', result);
              resolve(result);
            }
          },
          commitment
        );
      } catch (e) {
        done = true;
        // eslint-disable-next-line no-console
        console.error('WS error in setup', txid, e);
      }
      while (!done && queryStatus) {
        /* eslint-disable */
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([txid]);
            status = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!status) {
                console.log('REST null result for', txid, status);
              } else if (status.err) {
                console.log('REST error for', txid, status);
                done = true;
                reject(status.err);
              } else if (!status.confirmations) {
                console.log('REST no confirmations for', txid, status);
              } else {
                console.log('REST confirmation for', txid, status);
                done = true;
                resolve(status);
              }
            }
          } catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e);
            }
          }
        })();
        // eslint-disable-next-line no-await-in-loop
        await wait(2000);
      }
    })();
  })
    .catch((err) => {
      if (err.timeout && status) {
        status.err = { timeout: true };
      }
      connection.removeSignatureListener(subId);
    })
    .then((_) => {
      connection.removeSignatureListener(subId);
    });
  done = true;
  return status;
}

export const sendTransactionWithRetry = async (
  connection: Connection,
  wallet: Wallet,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  computeUnits = 0,
  commitment: Commitment = 'singleGossip',
  includesFeePayer: boolean = false,
  beforeSend?: () => void
) => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  let transaction = new Transaction();
  if (computeUnits > 0) {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    });
    transaction.add(modifyComputeUnits);
  }
  instructions.forEach((instruction) => transaction.add(instruction));
  transaction.recentBlockhash = (await connection.getLatestBlockhash(commitment)).blockhash;
  transaction.feePayer = wallet.publicKey;

  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  if (!includesFeePayer) {
    transaction = await wallet.signTransaction!(transaction);
  }

  if (beforeSend) {
    beforeSend();
  }

  const { txid, slot } = await sendSignedTransaction({
    connection,
    signedTransaction: transaction,
  });

  return { txid, slot };
};

export interface Txn {
  txid: string | null;
  slot: number | null;
}

export async function sendSignedTransaction({
  signedTransaction,
  connection,
  timeout = DEFAULT_TIMEOUT,
}: {
  signedTransaction: VersionedTransaction | Transaction;
  connection: Connection;
  timeout?: number;
}): Promise<Txn> {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();
  let slot = 0;
  const txid: TransactionSignature = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
  });

  console.log('Started awaiting confirmation for', txid);

  let done = false;
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      // eslint-disable-next-line no-await-in-loop
      await wait(500);
    }
  })();
  try {
    const confirmation = await awaitTransactionSignatureConfirmation(txid, timeout, connection);
    if (!confirmation) throw new Error('Timed out awaiting confirmation on transaction');

    if (confirmation.err) {
      console.error(confirmation.err);
      throw new Error('Transaction failed: Custom instruction error');
    }

    slot = confirmation?.slot || 0;
  } catch (err: any) {
    console.error('Transaction Error caught', err);
    if ((err as string) === 'timeout') {
      throw new Error('Timed out awaiting confirmation on transaction');
    }
    throw new Error('Transaction failed');
  } finally {
    done = true;
  }

  console.log('Latency', txid, getUnixTs() - startTime);
  return { txid, slot };
}

export const getUnixTs = () => new Date().getTime() / 1000;

export const reduceSettledPromise = <T>(settledPromise: PromiseSettledResult<T>[]) => {
  return settledPromise.reduce(
    (
      acc: {
        rejected: string[];
        fulfilled: T[];
      },
      cur
    ) => {
      if (cur.status === 'fulfilled') acc.fulfilled.push(cur.value);
      if (cur.status === 'rejected') acc.rejected.push(cur.reason);
      return acc;
    },
    { rejected: [], fulfilled: [] }
  );
};

interface QueueVersionedTransactionSignProps {
  transactions: VersionedTransaction[];
  signTransaction: <T extends VersionedTransaction>(transaction: T) => Promise<T>;
  signAllTransactions:
    | (<T extends VersionedTransaction>(transactions: T[]) => Promise<T[]>)
    | undefined;
  txInterval: number; //How long to wait between signing in milliseconds
  connection: Connection;
}

export async function queueVersionedTransactionSign({
  transactions,
  signAllTransactions,
  signTransaction,
  txInterval,
  connection,
}: QueueVersionedTransactionSignProps) {
  let signedTxs: VersionedTransaction[] = [];

  if (signAllTransactions) {
    signedTxs = await signAllTransactions(transactions);
  } else {
    //fallback to sign tx batches individually (if wallet doesn't support signAll)
    const settledTxs = await Promise.allSettled(
      transactions.map(async (tx) => {
        const signedTx = await signTransaction(tx);
        return signedTx;
      })
    );
    const { fulfilled } = reduceSettledPromise(settledTxs);

    signedTxs = fulfilled;
  }

  const pendingSigned = await Promise.allSettled(
    signedTxs.map((tx, i, allTx) => {
      // send all tx in intervals to avoid overloading the network
      return new Promise<{ tx: string; id: number }>((resolve, reject) => {
        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log(`Requesting Transaction ${i + 1}/${allTx.length}`);
          connection
            .sendRawTransaction(tx.serialize(), { skipPreflight: true })
            .then(async (txHash) => {
              // eslint-disable-next-line no-console
              console.log('Started awaiting confirmation for', txHash);

              const confirmation = await awaitTransactionSignatureConfirmation(
                txHash,
                DEFAULT_TIMEOUT,
                connection
              );

              if (!confirmation) throw new Error('Timed out awaiting confirmation on transaction');

              if (confirmation.err) {
                // eslint-disable-next-line no-console
                console.error(confirmation.err);
                throw new Error('Transaction failed: Custom instruction error');
              }

              resolve({ tx: txHash, id: i });
            })
            .catch((e) => {
              reject(e);
            });
        }, i * txInterval);
      });
    })
  );

  return pendingSigned;
}
