"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { fetchUserBets, BetData } from "@/lib/fetchUserBets";
import { fetchAllMarkets, MarketData } from "@/lib/fetchMarkets";

export default function MyBetsPage() {
  const router = useRouter();
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const [bets, setBets] = useState<BetData[]>([]);
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "history">("active");

  const loadData = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    const [betsData, marketsData] = await Promise.all([
      fetchUserBets(connection, publicKey),
      fetchAllMarkets(connection)
    ]);
    setBets(betsData);
    setMarkets(marketsData);
    setLoading(false);
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected && publicKey) loadData();
    else setLoading(false);
  }, [connected, publicKey, loadData]);

  const getMarketForBet = (bet: BetData) => markets.find(m => m.pubkey === bet.market);
  
  const activeBets = bets.filter(b => {
    const market = getMarketForBet(b);
    return market && market.status === "open";
  });
  
  const historyBets = bets.filter(b => {
    const market = getMarketForBet(b);
    return market && market.status === "resolved";
  });

  const totalStaked = bets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      <div className="orb-purple" style={{ width: "256px", height: "256px", top: "-64px", right: "-64px" }} />
      <div className="orb-cyan" style={{ width: "192px", height: "192px", bottom: "128px", left: "-64px" }} />
      <div className="relative z-10" style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 24px 120px 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "24px" }}>🚀</span><span className="font-display" style={{ fontSize: "20px", fontWeight: 700 }}>Ship or Slip</span></div>
          <WalletMultiButton />
        </header>

        <h1 className="font-display" style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>📋 My Bets</h1>

        {!connected ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <p style={{ color: "#6b7280", marginBottom: "16px" }}>Connect wallet to view your bets</p>
            <WalletMultiButton />
          </div>
        ) : loading ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "#6b7280" }}>Loading your bets...</p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <div className="font-display neon-text-cyan" style={{ fontSize: "24px", fontWeight: 700 }}>{bets.length}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Total Bets</div>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <div className="font-display" style={{ fontSize: "24px", fontWeight: 700, color: "#a855f7" }}>{totalStaked.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>SOL Staked</div>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <div className="font-display" style={{ fontSize: "24px", fontWeight: 700, color: "#22d3ee" }}>{activeBets.length}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Active</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <button
                onClick={() => setTab("active")}
                style={{
                  flex: 1, padding: "12px", borderRadius: "12px", fontWeight: 600, cursor: "pointer",
                  background: tab === "active" ? "linear-gradient(135deg, #00f5d4, #9b5de5)" : "rgba(255,255,255,0.05)",
                  border: tab === "active" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                🎯 Active ({activeBets.length})
              </button>
              <button
                onClick={() => setTab("history")}
                style={{
                  flex: 1, padding: "12px", borderRadius: "12px", fontWeight: 600, cursor: "pointer",
                  background: tab === "history" ? "linear-gradient(135deg, #00f5d4, #9b5de5)" : "rgba(255,255,255,0.05)",
                  border: tab === "history" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                📜 History ({historyBets.length})
              </button>
            </div>

            {(tab === "active" ? activeBets : historyBets).length === 0 ? (
              <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>{tab === "active" ? "🎲" : "📭"}</div>
                <p style={{ color: "#6b7280", marginBottom: "16px" }}>{tab === "active" ? "No active bets" : "No betting history"}</p>
                {tab === "active" && <button onClick={() => router.push("/")} className="btn-primary">Place a Bet</button>}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(tab === "active" ? activeBets : historyBets).map((bet, i) => {
                  const market = getMarketForBet(bet);
                  return (
                    <div key={i} className="glass-card" style={{ padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>{market?.repo || "Unknown Market"}</div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>PR #{market?.prNumber || "?"}</div>
                        </div>
                        <span style={{ 
                          fontSize: "10px", padding: "4px 8px", borderRadius: "9999px",
                          background: market?.status === "open" ? "rgba(0,245,212,0.2)" : "rgba(155,93,229,0.2)",
                          color: market?.status === "open" ? "#5eead4" : "#c4b5fd",
                          border: `1px solid ${market?.status === "open" ? "rgba(0,245,212,0.3)" : "rgba(155,93,229,0.3)"}`
                        }}>
                          {market?.status === "open" ? "Active" : "Resolved"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "20px" }}>{bet.side === "ship" ? "🚀" : "🕳️"}</span>
                          <span style={{ fontWeight: 600, color: bet.side === "ship" ? "#22d3ee" : "#a855f7" }}>{bet.side.toUpperCase()}</span>
                          <span style={{ color: "#6b7280" }}>{bet.amount.toFixed(2)} SOL</span>
                        </div>
                        {market?.status === "resolved" && (
                          <span style={{ 
                            fontWeight: 600, 
                            color: market.outcome === bet.side ? "#4ade80" : "#f87171" 
                          }}>
                            {market.outcome === bet.side ? "WON ✅" : "LOST ❌"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
