import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PROGRAM_ID, getMarketPDA, getVaultPDA, getBetPDA, MarketAccount, BetAccount } from "./program";

export async function createMarket(program: Program, repo: string, prNumber: number, deadlineTimestamp: number): Promise<string> {
  const [marketPDA] = getMarketPDA(repo, prNumber);
  const [vaultPDA] = getVaultPDA(marketPDA);
  const tx = await program.methods.createMarket(repo, prNumber, new BN(deadlineTimestamp)).accounts({ market: marketPDA, vault: vaultPDA, creator: program.provider.publicKey, systemProgram: SystemProgram.programId }).rpc();
  return tx;
}

export async function placeBet(program: Program, repo: string, prNumber: number, side: "ship" | "slip", amountSol: number): Promise<string> {
  const [marketPDA] = getMarketPDA(repo, prNumber);
  const [vaultPDA] = getVaultPDA(marketPDA);
  const [betPDA] = getBetPDA(marketPDA, program.provider.publicKey!);
  const sideArg = side === "ship" ? { ship: {} } : { slip: {} };
  const amountLamports = new BN(amountSol * LAMPORTS_PER_SOL);
  const tx = await program.methods.placeBet(sideArg, amountLamports).accounts({ market: marketPDA, vault: vaultPDA, bet: betPDA, bettor: program.provider.publicKey, systemProgram: SystemProgram.programId }).rpc();
  return tx;
}

export async function claimWinnings(program: Program, repo: string, prNumber: number): Promise<string> {
  const [marketPDA] = getMarketPDA(repo, prNumber);
  const [vaultPDA] = getVaultPDA(marketPDA);
  const [betPDA] = getBetPDA(marketPDA, program.provider.publicKey!);
  const tx = await program.methods.claim().accounts({ market: marketPDA, vault: vaultPDA, bet: betPDA, bettor: program.provider.publicKey, systemProgram: SystemProgram.programId }).rpc();
  return tx;
}

export async function fetchAllMarkets(program: Program): Promise<{ pubkey: PublicKey; account: MarketAccount }[]> {
  const markets = await program.account.market.all();
  return markets.map((m) => ({ pubkey: m.publicKey, account: m.account as unknown as MarketAccount }));
}

export async function fetchMarket(program: Program, repo: string, prNumber: number): Promise<MarketAccount | null> {
  const [marketPDA] = getMarketPDA(repo, prNumber);
  try { return await program.account.market.fetch(marketPDA) as unknown as MarketAccount; } catch { return null; }
}

export async function fetchUserBets(program: Program, userPubkey: PublicKey): Promise<{ pubkey: PublicKey; account: BetAccount }[]> {
  const bets = await program.account.bet.all([{ memcmp: { offset: 8, bytes: userPubkey.toBase58() } }]);
  return bets.map((b) => ({ pubkey: b.publicKey, account: b.account as unknown as BetAccount }));
}
