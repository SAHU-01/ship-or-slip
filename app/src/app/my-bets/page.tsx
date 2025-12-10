"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface Bet { id: string; repo: string; prTitle: string; prNumber: number; side: "ship" | "slip"; amount: number; potentialPayout: number; status: "active" | "won" | "lost"; timeLeft?: string; payout?: number; }

const MOCK_BETS: Bet[] = [
  { id: "1", repo: "solana-labs/solana", prTitle: "feat: Optimistic Confirmation & Turbine V2", prNumber: 12345, side: "ship", amount: 2.5, potentialPayout: 3.68, status: "active", timeLeft: "3h 59m" },
  { id: "2", repo: "coral-xyz/anchor", prTitle: "fix: IDL generation for complex types", prNumber: 2891, side: "slip", amount: 1.0, potentialPayout: 1.72, status: "active", timeLeft: "11h 59m" },
  { id: "3", repo: "metaplex/js", prTitle: "feat: Add compressed NFT support", prNumber: 892, side: "ship", amount: 5.0, potentialPayout: 8.25, status: "won", payout: 8.25 },
  { id: "4", repo: "solana-labs/solana-program-library", prTitle: "fix: Token-2022 transfer hook", prNumber: 4521, side: "slip", amount: 2.0, potentialPayout: 3.1, status: "lost" },
];

export default function MyBetsPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const [tab, setTab] = useState<"active" | "history">("active");
  const activeBets = MOCK_BETS.filter((b) => b.status === "active");
  const historyBets = MOCK_BETS.filter((b) => b.status !== "active");
  const totalWon = MOCK_BETS.filter((b) => b.status === "won").reduce((sum, b) => sum + (b.payout || 0), 0);
  const totalLost = MOCK_BETS.filter((b) => b.status === "lost").reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      <div className="orb-purple" style={{ width: "256px", height: "256px", top: "-64px", right: "-64px" }} />
      <div className="orb-cyan" style={{ width: "192px", height: "192px", bottom: "128px", left: "-64px" }} />
      <div className="relative z-10" style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 24px 120px 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "24px" }}>🚀</span><span className="font-display" style={{ fontSize: "20px", fontWeight: 700 }}>Ship or Slip</span></div>
          <WalletMultiButton />
        </header>
        <h1 className="font-display" style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px" }}>📋 My Bets</h1>
        {!connected ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}><div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div><p style={{ color: "#9ca3af", marginBottom: "16px" }}>Connect your wallet to view your bets</p><WalletMultiButton /></div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}><div className="font-display neon-text-cyan" style={{ fontSize: "24px", fontWeight: 700 }}>{activeBets.length}</div><div style={{ fontSize: "12px", color: "#6b7280" }}>Active</div></div>
              <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}><div className="font-display" style={{ fontSize: "24px", fontWeight: 700, color: "#4ade80" }}>+{totalWon.toFixed(1)}</div><div style={{ fontSize: "12px", color: "#6b7280" }}>SOL Won</div></div>
              <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}><div className="font-display" style={{ fontSize: "24px", fontWeight: 700, color: "#f87171" }}>-{totalLost.toFixed(1)}</div><div style={{ fontSize: "12px", color: "#6b7280" }}>SOL Lost</div></div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <button onClick={() => setTab("active")} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: tab === "active" ? "rgba(155,93,229,0.3)" : "rgba(255,255,255,0.05)", border: tab === "active" ? "2px solid #9b5de5" : "2px solid transparent", color: "white", fontWeight: 600, cursor: "pointer" }}>🎲 Active ({activeBets.length})</button>
              <button onClick={() => setTab("history")} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: tab === "history" ? "rgba(155,93,229,0.3)" : "rgba(255,255,255,0.05)", border: tab === "history" ? "2px solid #9b5de5" : "2px solid transparent", color: "white", fontWeight: 600, cursor: "pointer" }}>📜 History ({historyBets.length})</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(tab === "active" ? activeBets : historyBets).map((bet) => (
                <div key={bet.id} className="glass-card" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}><div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>{bet.repo}</div><div className="font-display" style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>{bet.prTitle}</div></div>
                    {bet.status === "active" ? (<span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "9999px", background: "rgba(0,245,212,0.2)", color: "#5eead4", border: "1px solid rgba(0,245,212,0.3)", marginLeft: "12px", flexShrink: 0 }}>⏱️ {bet.timeLeft}</span>) : (<span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "9999px", background: bet.status === "won" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)", color: bet.status === "won" ? "#4ade80" : "#f87171", border: `1px solid ${bet.status === "won" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, marginLeft: "12px", flexShrink: 0 }}>{bet.status === "won" ? "✓ WON" : "✗ LOST"}</span>)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><span className={bet.side === "ship" ? "neon-text-cyan" : "neon-text-purple"} style={{ fontSize: "14px", fontWeight: 600 }}>{bet.side === "ship" ? "🚀 SHIP" : "🕳️ SLIP"}</span><span style={{ color: "#9ca3af", fontSize: "13px" }}>{bet.amount} SOL</span></div>
                    <div style={{ textAlign: "right" }}>{bet.status === "active" ? (<><div style={{ fontSize: "11px", color: "#6b7280" }}>Potential</div><div className="font-display neon-text-cyan" style={{ fontWeight: 600 }}>{bet.potentialPayout} SOL</div></>) : (<div className="font-display" style={{ fontWeight: 600, color: bet.status === "won" ? "#4ade80" : "#f87171" }}>{bet.status === "won" ? `+${bet.payout}` : `-${bet.amount}`} SOL</div>)}</div>
                  </div>
                </div>
              ))}
              {(tab === "active" ? activeBets : historyBets).length === 0 && (<div className="glass-card" style={{ padding: "48px", textAlign: "center" }}><div style={{ fontSize: "48px", marginBottom: "16px" }}>{tab === "active" ? "🎲" : "📜"}</div><p style={{ color: "#6b7280" }}>{tab === "active" ? "No active bets" : "No betting history"}</p></div>)}
            </div>
          </>
        )}
      </div>
      <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px", zIndex: 50 }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          <div className="nav-item" onClick={() => router.push("/")}><span style={{ fontSize: "18px" }}>🏠</span><span style={{ fontSize: "10px" }}>Home</span></div>
          <div className="nav-item active"><span style={{ fontSize: "18px" }}>📋</span><span style={{ fontSize: "10px" }}>My Bets</span></div>
          <div className="nav-item" onClick={() => router.push("/leaderboard")}><span style={{ fontSize: "18px" }}>🏆</span><span style={{ fontSize: "10px" }}>Leaderboard</span></div>
          <div className="nav-item" onClick={() => router.push("/profile")}><span style={{ fontSize: "18px" }}>👤</span><span style={{ fontSize: "10px" }}>Profile</span></div>
        </div>
      </nav>
    </div>
  );
}
