import { Connection, Transaction } from "@solana/web3.js";
import { createMarketInstruction, placeBetInstruction, claimInstruction, getMarketPDA, getVaultPDA, getBetPDA } from "./rawTransaction";

export async function createMarket(connection: Connection, wallet: any, repo: string, prNumber: number, deadlineTimestamp: number): Promise<string> {
  const [marketPDA] = getMarketPDA(repo, prNumber);
  const [vaultPDA] = getVaultPDA(marketPDA);
  const ix = createMarketInstruction(repo, prNumber, deadlineTimestamp, marketPDA, vaultPDA, wallet.publicKey);
  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

export async function placeBet(connection: Connection, wallet: any, repo: string, prNumber: number, side: "ship" | "slip", amount: number): Promise<string> {
  const [marketPDA] = getMarketPDA(repo, prNumber);
  const [vaultPDA] = getVaultPDA(marketPDA);
  const [betPDA] = getBetPDA(marketPDA, wallet.publicKey);
  const ix = placeBetInstruction(side, amount, marketPDA, vaultPDA, betPDA, wallet.publicKey);
  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

export async function claimWinnings(connection: Connection, wallet: any, repo: string, prNumber: number): Promise<string> {
  const [marketPDA] = getMarketPDA(repo, prNumber);
  const [vaultPDA] = getVaultPDA(marketPDA);
  const [betPDA] = getBetPDA(marketPDA, wallet.publicKey);
  const ix = claimInstruction(marketPDA, vaultPDA, betPDA, wallet.publicKey);
  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}
