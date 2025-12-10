"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

interface Market {
  id: string;
  repo: string;
  prTitle: string;
  prNumber: number;
  deadline: number;
  shipPool: number;
  slipPool: number;
  bettorCount: number;
}

const MOCK_MARKETS: Market[] = [
  {
    id: "1", repo: "solana-labs/solana", prTitle: "feat: Optimistic Confirmation & Turbine V2",
    prNumber: 12345, deadline: Math.floor(Date.now() / 1000) + 4 * 3600,
    shipPool: 306.17, slipPool: 144.08, bettorCount: 47,
  },
  {
    id: "2", repo: "coral-xyz/anchor", prTitle: "fix: IDL generation for complex types",
    prNumber: 2891, deadline: Math.floor(Date.now() / 1000) + 12 * 3600,
    shipPool: 89.5, slipPool: 124.3, bettorCount: 28,
  },
  {
    id: "3", repo: "jito-labs/jito-solana", prTitle: "perf: Bundle processing optimizations",
    prNumber: 456, deadline: Math.floor(Date.now() / 1000) + 2 * 3600,
    shipPool: 512.8, slipPool: 201.2, bettorCount: 83,
  },
];

function MarketCard({ market }: { market: Market }) {
  const [timeLeft, setTimeLeft] = useState("");
  const totalPool = market.shipPool + market.slipPool;
  const shipPct = Math.round((market.shipPool / totalPool) * 100);
  const slipPct = 100 - shipPct;

  useEffect(() => {
    const update = () => {
      const diff = market.deadline - Math.floor(Date.now() / 1000);
      if (diff <= 0) { setTimeLeft("ENDED"); return; }
      setTimeLeft(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [market.deadline]);

  return (
    <div 
      className="glass-card group"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "220px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", color: "#c4b5fd", border: "1px solid rgba(155,93,229,0.3)" }}>
          PR #{market.prNumber}
        </span>
        <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: "rgba(0,245,212,0.2)", color: "#5eead4", border: "1px solid rgba(0,245,212,0.3)" }}>
          ⏱️ {timeLeft}
        </span>
      </div>
      
      {/* Repo */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <GitHubIcon />
        <span style={{ color: "#9ca3af", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{market.repo}</span>
      </div>
      
      {/* Title */}
      <h3 
        className="font-display group-hover:text-cyan-300"
        style={{ 
          fontSize: "14px", 
          fontWeight: 600, 
          color: "white", 
          marginBottom: "12px", 
          lineHeight: "1.3",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: "36px",
          transition: "color 0.2s",
        }}
      >
        {market.prTitle}
      </h3>
      
      {/* Progress Bar */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            🚀 <span className="neon-text-cyan">{shipPct}%</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="neon-text-purple">{slipPct}%</span> 🕳️
          </span>
        </div>
        <div style={{ height: "6px", borderRadius: "9999px", background: "#1f2937", overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${shipPct}%`, background: "linear-gradient(to right, #22d3ee, #06b6d4)" }} />
          <div style={{ width: `${slipPct}%`, background: "linear-gradient(to right, #a855f7, #9333ea)" }} />
        </div>
      </div>
      
      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", paddingTop: "8px", borderTop: "1px solid rgba(0,245,212,0.2)", marginTop: "auto" }}>
        <span style={{ color: "#9ca3af" }}>
          <span style={{ color: "white", fontWeight: 600 }}>{totalPool.toFixed(1)}</span> SOL
        </span>
        <span style={{ color: "#6b7280" }}>👥 {market.bettorCount}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      <div className="orb-purple w-80 h-80 -top-32 -right-32" />
      <div className="orb-cyan w-64 h-64 top-1/3 -left-24" />
      <div className="orb-purple w-40 h-40 bottom-20 right-10 opacity-50" />

      <div className="relative z-10" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 48px 96px 48px" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>🚀</span>
            <span className="font-display" style={{ fontSize: "20px", fontWeight: 700 }}>Ship or Slip</span>
          </div>
          <WalletMultiButton />
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", border: "1px solid rgba(155,93,229,0.3)", marginBottom: "16px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "12px", color: "#c4b5fd" }}>Live on Solana Devnet</span>
          </div>

          <h1 className="font-display" style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, marginBottom: "12px" }}>
            <span className="neon-text-cyan">SHIP</span>
            <span style={{ color: "white", margin: "0 12px" }}>or</span>
            <span className="neon-text-purple">SLIP</span>
          </h1>

          <p style={{ fontSize: "18px", color: "#d1d5db", marginBottom: "4px" }}>Dev Velocity Arcade</p>
          <p style={{ color: "#6b7280", fontSize: "14px", maxWidth: "400px", margin: "0 auto" }}>
            Bet on whether GitHub PRs will ship on time.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "48px", marginTop: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <div className="font-display neon-text-cyan" style={{ fontSize: "24px", fontWeight: 700 }}>2,847</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Total Bets</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="font-display" style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>1,245</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>SOL Pooled</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="font-display neon-text-purple" style={{ fontSize: "24px", fontWeight: 700 }}>67%</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Ship Rate</div>
            </div>
          </div>
        </section>

        {/* Markets */}
        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display" style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }}></span>
            Live Markets
          </h2>
          
          {/* 3 Column Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "20px",
          }}>
            {MOCK_MARKETS.map((m) => (
              <Link key={m.id} href={`/market/${m.id}`} style={{ display: "block" }}>
                <MarketCard market={m} />
              </Link>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section className="glass-card-purple" style={{ padding: "32px" }}>
          <h2 className="font-display" style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "24px" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {[
              { emoji: "1️⃣", title: "Pick a PR", desc: "Browse markets" },
              { emoji: "2️⃣", title: "Make Your Call", desc: "🚀 SHIP or 🕳️ SLIP" },
              { emoji: "3️⃣", title: "Stake SOL", desc: "On-chain bets" },
              { emoji: "4️⃣", title: "Collect", desc: "Winners split pool" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>{s.emoji}</span>
                <h3 className="font-display" style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{s.title}</h3>
                <p style={{ fontSize: "11px", color: "#6b7280" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px", zIndex: 50 }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          <div className="nav-item active"><span style={{ fontSize: "18px" }}>🏠</span><span style={{ fontSize: "10px" }}>Home</span></div>
          <div className="nav-item"><span style={{ fontSize: "18px" }}>📋</span><span style={{ fontSize: "10px" }}>My Bets</span></div>
          <div className="nav-item"><span style={{ fontSize: "18px" }}>🏆</span><span style={{ fontSize: "10px" }}>Leaderboard</span></div>
          <div className="nav-item"><span style={{ fontSize: "18px" }}>👤</span><span style={{ fontSize: "10px" }}>Profile</span></div>
        </div>
      </nav>
    </div>
  );
}
