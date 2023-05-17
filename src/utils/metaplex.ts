import {
  AccountMeta,
  Connection,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import {
  Metadata,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const TOKEN_AUTH_RULES_ID = new PublicKey(
  'auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg',
);

export const getMetadataAccount = (mint: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata', 'utf8'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
};

export function findTokenRecordPda(
  mint: PublicKey,
  token: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from('token_record'),
      token.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

interface PNFTAccounts {
  metadataProgram: AccountMeta;
  delegateRecord: AccountMeta;
  tokenRecord: AccountMeta;
  tokenMint: AccountMeta;
  edition: AccountMeta;
  authRulesProgram: AccountMeta;
  authRules: AccountMeta;
  sysvarInstructions: AccountMeta;
  programAsSigner: AccountMeta;
  systemProgram: AccountMeta;
  sellerTokenRecord: AccountMeta;
}

export const getMasterEditionAccount = (mint: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata', 'utf8'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
};

export const getPNFTAccounts = async (
  connection: Connection,
  wallet: PublicKey,
  programAsSigner: PublicKey,
  mint: PublicKey,
  seller?: PublicKey,
): Promise<PNFTAccounts> => {
  const metadata = await Metadata.fromAccountAddress(
    connection,
    getMetadataAccount(mint),
  );
  const ata = getAssociatedTokenAddressSync(mint, wallet);
  const tokenRecord = findTokenRecordPda(mint, ata);
  const masterEdition = getMasterEditionAccount(mint);
  const authRules = metadata.programmableConfig?.ruleSet;
  const pasAssociatedTokenAccount = getAssociatedTokenAddressSync(
    mint,
    programAsSigner,
    true,
  );
  const delegateRecord = findTokenRecordPda(mint, pasAssociatedTokenAccount);
  let sellerTokenRecord = TOKEN_METADATA_PROGRAM_ID;

  if (seller) {
    const sellerATA = getAssociatedTokenAddressSync(mint, seller);
    sellerTokenRecord = findTokenRecordPda(mint, sellerATA);
  }

  return {
    metadataProgram: {
      isSigner: false,
      isWritable: false,
      pubkey: TOKEN_METADATA_PROGRAM_ID,
    },
    delegateRecord: {
      isSigner: false,
      isWritable: true,
      pubkey: delegateRecord ?? tokenRecord,
    },
    tokenRecord: {
      isSigner: false,
      isWritable: true,
      pubkey: tokenRecord,
    },
    tokenMint: {
      isSigner: false,
      isWritable: false,
      pubkey: mint,
    },
    edition: {
      isSigner: false,
      isWritable: false,
      pubkey: masterEdition,
    },
    authRulesProgram: {
      isSigner: false,
      isWritable: false,
      pubkey: TOKEN_AUTH_RULES_ID,
    },
    authRules: {
      isSigner: false,
      isWritable: false,
      pubkey: authRules ?? TOKEN_METADATA_PROGRAM_ID,
    },
    sysvarInstructions: {
      isSigner: false,
      isWritable: false,
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
    },
    programAsSigner: {
      isSigner: false,
      isWritable: false,
      pubkey: programAsSigner,
    },
    systemProgram: {
      isSigner: false,
      isWritable: false,
      pubkey: SystemProgram.programId,
    },
    sellerTokenRecord: {
      isSigner: false,
      isWritable: true,
      pubkey: sellerTokenRecord,
    },
  };
};
