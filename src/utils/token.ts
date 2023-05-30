import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { Connection, PublicKey } from '@solana/web3.js';

export const getMetadata = async (
  connection: Connection,
  metadataAccount: PublicKey
): Promise<Metadata | null> => {
  const accountData = await connection.getAccountInfo(metadataAccount, 'confirmed');

  if (!accountData) {
    return null;
  }

  return Metadata.deserialize(accountData.data)[0];
};
