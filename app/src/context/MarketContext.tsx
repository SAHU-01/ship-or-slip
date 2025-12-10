"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useProgram, MarketAccount, lamportsToSol } from "@/lib/program";
import { fetchAllMarkets } from "@/lib/marketService";
import { PublicKey } from "@solana/web3.js";

export interface Market {
  id: string;
  pubkey: PublicKey;
  repo: string;
  prNumber: number;
  prTitle: string;
  deadline: number;
  shipPool: number;
  slipPool: number;
  bettorCount: number;
  status: "open" | "resolved";
  outcome: "pending" | "ship" | "slip";
}

interface MarketContextType {
  markets: Market[];
  loading: boolean;
  error: string | null;
  refreshMarkets: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType>({ markets: [], loading: false, error: null, refreshMarkets: async () => {} });

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const program = useProgram();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMarkets = useCallback(async () => {
    if (!program) return;
    setLoading(true);
    setError(null);
    try {
      const rawMarkets = await fetchAllMarkets(program);
      const formattedMarkets: Market[] = rawMarkets.map((m) => ({
        id: m.pubkey.toBase58(),
        pubkey: m.pubkey,
        repo: m.account.repo,
        prNumber: m.account.prNumber,
        prTitle: `PR #${m.account.prNumber}`,
        deadline: m.account.deadline.toNumber(),
        shipPool: lamportsToSol(m.account.shipPool),
        slipPool: lamportsToSol(m.account.slipPool),
        bettorCount: m.account.totalBettors,
        status: "open" in m.account.status ? "open" : "resolved",
        outcome: "pending" in m.account.outcome ? "pending" : "ship" in m.account.outcome ? "ship" : "slip",
      }));
      setMarkets(formattedMarkets);
    } catch (err) {
      console.error("Failed to fetch markets:", err);
      setError("Failed to load markets");
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => { if (program) refreshMarkets(); }, [program, refreshMarkets]);

  return <MarketContext.Provider value={{ markets, loading, error, refreshMarkets }}>{children}</MarketContext.Provider>;
}

export function useMarkets() { return useContext(MarketContext); }
