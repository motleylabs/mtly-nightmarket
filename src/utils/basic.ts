import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const toLamports = (priceInSol: number): number =>
  priceInSol * LAMPORTS_PER_SOL;
