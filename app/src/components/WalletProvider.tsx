"use client";

import { Buffer } from "buffer";
if (typeof window !== "undefined") { window.Buffer = Buffer; }

import { FC, ReactNode, useMemo, useEffect, useState } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);
  const wallets = useMemo(() => [], []);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen circuit-bg" />;
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
