import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { AuctionHouse } from '../../types';
import { AuctionHouseProgram, getMetadataAccount, toLamports } from 'src/utils';
import { RewardCenterProgram } from '../modules';
import {
  CreateOfferInstructionAccounts,
  CreateOfferInstructionArgs,
  createCreateOfferInstruction,
} from '@motleylabs/mtly-reward-center';

export const getCreateOfferIxs = async ({
  connection,
  auctionHouse,
  mint,
  amount,
  seller,
  buyer,
}: {
  connection: Connection;
  auctionHouse: AuctionHouse;
  mint: PublicKey;
  amount: number;
  seller: PublicKey;
  buyer: PublicKey;
}): Promise<TransactionInstruction[]> => {
  if (!auctionHouse.rewardCenter) {
    throw 'reward center data not found';
  }

  const auctionHouseAddress = new PublicKey(auctionHouse.address);
  const buyerPrice = toLamports(amount);
  const authority = new PublicKey(auctionHouse.authority);
  const ahFeeAcc = new PublicKey(auctionHouse.auctionHouseFeeAccount);
  const treasuryMint = new PublicKey(auctionHouse.treasuryMint);
  const metadata = getMetadataAccount(mint);
  const associatedTokenAccount = getAssociatedTokenAddressSync(mint, seller);
  const token = auctionHouse.rewardCenter!.tokenMint;

  const [escrowPaymentAcc, escrowPaymentBump] =
    AuctionHouseProgram.findEscrowPaymentAccountAddress(
      auctionHouseAddress,
      buyer,
    );

  const [buyerTradeState, buyerTradeStateBump] =
    AuctionHouseProgram.findPublicBidTradeStateAddress(
      buyer,
      auctionHouseAddress,
      treasuryMint,
      mint,
      buyerPrice,
      1,
    );

  const [rewardCenter] =
    RewardCenterProgram.findRewardCenterAddress(auctionHouseAddress);
  const [offer] = RewardCenterProgram.findOfferAddress(
    buyer,
    metadata,
    rewardCenter,
  );
  const [auctioneer] = RewardCenterProgram.findAuctioneerAddress(
    auctionHouseAddress,
    rewardCenter,
  );

  const accounts: CreateOfferInstructionAccounts = {
    wallet: buyer,
    offer,
    paymentAccount: buyer,
    transferAuthority: buyer,
    treasuryMint,
    tokenAccount: associatedTokenAccount,
    metadata,
    escrowPaymentAccount: escrowPaymentAcc,
    authority,
    rewardCenter,
    auctionHouse: auctionHouseAddress,
    auctionHouseFeeAccount: ahFeeAcc,
    buyerTradeState,
    ahAuctioneerPda: auctioneer,
    auctionHouseProgram: AuctionHouseProgram.PUBKEY,
  };

  const args: CreateOfferInstructionArgs = {
    createOfferParams: {
      tradeStateBump: buyerTradeStateBump,
      escrowPaymentBump,
      buyerPrice,
      tokenSize: 1,
    },
  };

  const instruction = createCreateOfferInstruction(accounts, args);

  // patch metadata account to writable for AH / RWD
  for (let i = 0; i < instruction.keys.length; i++) {
    if (instruction.keys[i].pubkey.equals(metadata)) {
      instruction.keys[i].isWritable = true;
    }
  }

  const ixs: TransactionInstruction[] = [];

  const ix = ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 });
  ixs.push(ix);

  const buyerRewardTokenAccount = getAssociatedTokenAddressSync(token, buyer);

  const buyerATAInstruction = createAssociatedTokenAccountInstruction(
    buyer,
    buyerRewardTokenAccount,
    buyer,
    token,
  );

  const buyerAtAInfo = await connection.getAccountInfo(buyerRewardTokenAccount);

  if (!buyerAtAInfo) {
    ixs.push(buyerATAInstruction);
  }

  ixs.push(instruction);

  return ixs;
};
