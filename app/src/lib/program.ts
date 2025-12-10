import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import idl from "./idl.json";

export const PROGRAM_ID = new PublicKey("HSkqo48KXh7xF7RLPCqQEtExBH6AqdU4rz6s2odFgYAi");

export interface MarketAccount {
  repo: string;
  prNumber: number;
  deadline: BN;
  shipPool: BN;
  slipPool: BN;
  totalBettors: number;
  status: { open: {} } | { resolved: {} };
  outcome: { pending: {} } | { ship: {} } | { slip: {} };
  bump: number;
}

export interface BetAccount {
  bettor: PublicKey;
  market: PublicKey;
  side: { ship: {} } | { slip: {} };
  amount: BN;
  claimed: boolean;
  bump: number;
}

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    return new Program(idl as Idl, provider);
  }, [connection, wallet]);
  return program;
}

export function getMarketPDA(repo: string, prNumber: number): [PublicKey, number] {
  const repoBytes = Buffer.from(repo.slice(0, 100));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), repoBytes, new BN(prNumber).toArrayLike(Buffer, "le", 4)],
    PROGRAM_ID
  );
}

export function getVaultPDA(marketPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("vault"), marketPubkey.toBuffer()], PROGRAM_ID);
}

export function getBetPDA(marketPubkey: PublicKey, bettorPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("bet"), marketPubkey.toBuffer(), bettorPubkey.toBuffer()], PROGRAM_ID);
}

export function lamportsToSol(lamports: BN | number): number {
  const val = typeof lamports === "number" ? lamports : lamports.toNumber();
  return val / 1_000_000_000;
}

export function solToLamports(sol: number): BN {
  return new BN(sol * 1_000_000_000);
}
