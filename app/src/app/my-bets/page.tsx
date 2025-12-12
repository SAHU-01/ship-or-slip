"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { fetchUserBets, BetData } from "@/lib/fetchUserBets";
import { fetchAllMarkets, MarketData } from "@/lib/fetchMarkets";
import { fetchPRStatus, PRStatus } from "@/lib/githubStatus";
import { claimWinnings } from "@/lib/marketService";

interface BetWithStatus {
  bet: BetData;
  marketData?: MarketData;
  prStatus?: PRStatus | null;
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 200,
      padding: "16px 24px", borderRadius: "12px",
      background: type === "success" ? "rgba(34, 197, 94, 0.95)" : "rgba(239, 68, 68, 0.95)",
      color: "white", fontWeight: 600, fontSize: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      display: "flex", alignItems: "center", gap: "12px",
    }}>
      <span style={{ fontSize: "24px" }}>{type === "success" ? "🎉" : "❌"}</span>
      {message}
    </div>
  );
}

export default function MyBetsPage() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { connected, publicKey } = wallet;
  const [betsWithStatus, setBetsWithStatus] = useState<BetWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");

  const loadData = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    
    const [betsData, marketsData] = await Promise.all([
      fetchUserBets(connection, publicKey),
      fetchAllMarkets(connection)
    ]);
    
    const enrichedBets: BetWithStatus[] = await Promise.all(
      betsData.map(async (bet) => {
        const marketData = marketsData.find(m => m.pubkey === bet.market);
        let prStatus: PRStatus | null = null;
        if (marketData) {
          prStatus = await fetchPRStatus(marketData.repo, marketData.prNumber);
        }
        return { bet, marketData, prStatus };
      })
    );
    
    setBetsWithStatus(enrichedBets);
    setLoading(false);
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected && publicKey) loadData();
    else setLoading(false);
  }, [connected, publicKey, loadData]);

  const handleClaim = async (item: BetWithStatus) => {
    if (!item.marketData || !wallet.publicKey || !wallet.signTransaction) return;
    setClaiming(item.bet.pubkey);
    try {
      const sig = await claimWinnings(connection, wallet, item.marketData.repo, item.marketData.prNumber);
      setToast({ message: `🎉 Winnings claimed! TX: ${sig.slice(0, 12)}...`, type: "success" });
      loadData();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to claim", type: "error" });
    } finally {
      setClaiming(null);
    }
  };

  const activeBets = betsWithStatus.filter(b => {
    if (!b.marketData) return false;
    if (b.marketData.status === "resolved") return false;
    if (b.prStatus?.state === "merged" || b.prStatus?.state === "closed") return false;
    return true;
  });
  
  const historyBets = betsWithStatus.filter(b => {
    if (!b.marketData) return true;
    if (b.marketData.status === "resolved") return true;
    if (b.prStatus?.state === "merged" || b.prStatus?.state === "closed") return true;
    return false;
  });

  const totalStaked = betsWithStatus.reduce((sum, b) => sum + b.bet.amount, 0);

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
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
                <div className="font-display neon-text-cyan" style={{ fontSize: "24px", fontWeight: 700 }}>{betsWithStatus.length}</div>
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
              <button onClick={() => setTab("active")} style={{ flex: 1, padding: "12px", borderRadius: "12px", fontWeight: 600, cursor: "pointer", background: tab === "active" ? "linear-gradient(135deg, #00f5d4, #9b5de5)" : "rgba(255,255,255,0.05)", border: tab === "active" ? "none" : "1px solid rgba(255,255,255,0.1)", color: "white" }}>🎯 Active ({activeBets.length})</button>
              <button onClick={() => setTab("history")} style={{ flex: 1, padding: "12px", borderRadius: "12px", fontWeight: 600, cursor: "pointer", background: tab === "history" ? "linear-gradient(135deg, #00f5d4, #9b5de5)" : "rgba(255,255,255,0.05)", border: tab === "history" ? "none" : "1px solid rgba(255,255,255,0.1)", color: "white" }}>📜 History ({historyBets.length})</button>
            </div>

            {(tab === "active" ? activeBets : historyBets).length === 0 ? (
              <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>{tab === "active" ? "🎲" : "📭"}</div>
                <p style={{ color: "#6b7280", marginBottom: "16px" }}>{tab === "active" ? "No active bets" : "No betting history"}</p>
                {tab === "active" && <button onClick={() => router.push("/")} className="btn-primary">Place a Bet</button>}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(tab === "active" ? activeBets : historyBets).map((item, i) => {
                  const { bet, marketData, prStatus } = item;
                  const isDecided = prStatus?.state === "merged" || prStatus?.state === "closed";
                  const isResolved = marketData?.status === "resolved";
                  const didWin = isResolved && marketData?.outcome === bet.side;
                  const prOutcome = prStatus?.state === "merged" ? "ship" : "slip";
                  const willWin = isDecided && !isResolved && prOutcome === bet.side;
                  const canClaim = isResolved && didWin && !bet.claimed;
                  
                  return (
                    <div key={i} className="glass-card" style={{ padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>{marketData?.repo || "Unknown"}</div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>PR #{marketData?.prNumber || "?"}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                          {prStatus && (
                            <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: prStatus.state === "open" ? "rgba(74,222,128,0.2)" : prStatus.state === "merged" ? "rgba(34,211,238,0.2)" : "rgba(239,68,68,0.2)", color: prStatus.state === "open" ? "#4ade80" : prStatus.state === "merged" ? "#22d3ee" : "#f87171" }}>
                              {prStatus.state === "open" ? "🟢 PR Open" : prStatus.state === "merged" ? "🚀 Merged" : "🕳️ Closed"}
                            </span>
                          )}
                          <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: isResolved ? "rgba(155,93,229,0.2)" : isDecided ? "rgba(251,191,36,0.2)" : "rgba(0,245,212,0.2)", color: isResolved ? "#c4b5fd" : isDecided ? "#fbbf24" : "#5eead4" }}>
                            {isResolved ? (bet.claimed ? "Claimed" : "Resolved") : isDecided ? "⏳ Awaiting Payout" : "Active"}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "20px" }}>{bet.side === "ship" ? "🚀" : "🕳️"}</span>
                          <span style={{ fontWeight: 600, color: bet.side === "ship" ? "#22d3ee" : "#a855f7" }}>{bet.side.toUpperCase()}</span>
                          <span style={{ color: "#6b7280" }}>{bet.amount.toFixed(2)} SOL</span>
                        </div>
                        
                        {isResolved ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 600, color: didWin ? "#4ade80" : "#f87171" }}>
                              {didWin ? "WON ✅" : "LOST ❌"}
                            </span>
                            {canClaim && (
                              <button
                                onClick={() => handleClaim(item)}
                                disabled={claiming === bet.pubkey}
                                style={{
                                  padding: "6px 12px", borderRadius: "8px", fontWeight: 600, fontSize: "12px",
                                  background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "white",
                                  border: "none", cursor: "pointer", opacity: claiming === bet.pubkey ? 0.5 : 1
                                }}
                              >
                                {claiming === bet.pubkey ? "..." : "💰 CLAIM"}
                              </button>
                            )}
                            {isResolved && didWin && bet.claimed && (
                              <span style={{ fontSize: "11px", color: "#4ade80" }}>✓ Claimed</span>
                            )}
                          </div>
                        ) : isDecided ? (
                          <span style={{ fontWeight: 600, color: willWin ? "#4ade80" : "#f87171" }}>
                            {willWin ? "WINNING 🎉" : "LOSING 😢"}
                          </span>
                        ) : null}
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
