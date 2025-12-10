import { Connection, Transaction } from "@solana/web3.js";
import { getMarketPDA, getVaultPDA, getBetPDA, createMarketInstruction, placeBetInstruction } from "./rawTransaction";

export { getMarketPDA, getVaultPDA, getBetPDA };

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

export async function placeBet(connection: Connection, wallet: any, repo: string, prNumber: number, side: "ship" | "slip", amountSol: number): Promise<string> {
  const [marketPDA] = getMarketPDA(repo, prNumber);
  const [vaultPDA] = getVaultPDA(marketPDA);
  const [betPDA] = getBetPDA(marketPDA, wallet.publicKey);
  const ix = placeBetInstruction(side, amountSol, marketPDA, vaultPDA, betPDA, wallet.publicKey);
  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}
