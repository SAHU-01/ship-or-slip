"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { fetchUserBets } from "@/lib/fetchUserBets";
import { fetchAllMarkets } from "@/lib/fetchMarkets";
import { fetchPRStatus } from "@/lib/githubStatus";
import { calculateProfileStats, ProfileStats, BetWithContext } from "@/lib/badges";

export default function ProfilePage() {
  const router = useRouter();
  const { connection } = useConnection();
  const { connected, publicKey, disconnect } = useWallet();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    
    const [bets, markets] = await Promise.all([
      fetchUserBets(connection, publicKey),
      fetchAllMarkets(connection)
    ]);
    
    // Enrich bets with market and PR status
    const betsWithContext: BetWithContext[] = await Promise.all(
      bets.map(async (bet) => {
        const market = markets.find(m => m.pubkey === bet.market);
        let prStatus = null;
        if (market) {
          prStatus = await fetchPRStatus(market.repo, market.prNumber);
        }
        return { ...bet, market, prStatus };
      })
    );
    
    const profileStats = calculateProfileStats(betsWithContext);
    setStats(profileStats);
    setLoading(false);
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected && publicKey) loadProfile();
  }, [connected, publicKey, loadProfile]);

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      <div className="orb-purple" style={{ width: "256px", height: "256px", top: "-64px", right: "-64px" }} />
      <div className="orb-cyan" style={{ width: "192px", height: "192px", bottom: "128px", left: "-64px" }} />
      <div className="relative z-10" style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 24px 120px 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "24px" }}>🚀</span><span className="font-display" style={{ fontSize: "20px", fontWeight: 700 }}>Ship or Slip</span></div>
          <WalletMultiButton />
        </header>
        
        {!connected ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>👤</div>
            <h2 className="font-display" style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Your Profile</h2>
            <p style={{ color: "#9ca3af", marginBottom: "24px" }}>Connect your wallet to view your profile</p>
            <WalletMultiButton />
          </div>
        ) : loading || !stats ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "#6b7280" }}>Loading profile...</p>
          </div>
        ) : (
          <>
            <div className="glass-card" style={{ padding: "24px", marginBottom: "16px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #9b5de5, #00f5d4)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>🎰</div>
              <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>Predictor</h1>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "12px" }}>{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ padding: "6px 16px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", border: "1px solid rgba(155,93,229,0.3)" }}>
                  <span style={{ fontSize: "12px", color: "#c4b5fd" }}>{stats.totalBets} Bets</span>
                </div>
                <div style={{ padding: "6px 16px", borderRadius: "9999px", background: "rgba(0,245,212,0.2)", border: "1px solid rgba(0,245,212,0.3)" }}>
                  <span style={{ fontSize: "12px", color: "#5eead4" }}>{stats.badges.length} Badges</span>
                </div>
                <div style={{ padding: "6px 16px", borderRadius: "9999px", background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.3)" }}>
                  <span style={{ fontSize: "12px", color: "#4ade80" }}>Devnet Beta</span>
                </div>
              </div>
            </div>

            {/* Pending Outcomes Banner */}
            {(stats.pendingWins > 0 || stats.pendingLosses > 0) && (
              <div className="glass-card" style={{ padding: "16px", marginBottom: "16px", background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fbbf24", marginBottom: "4px" }}>⏳ Pending Resolution</div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      {stats.pendingWins > 0 && <span style={{ color: "#4ade80" }}>{stats.pendingWins} winning</span>}
                      {stats.pendingWins > 0 && stats.pendingLosses > 0 && " • "}
                      {stats.pendingLosses > 0 && <span style={{ color: "#f87171" }}>{stats.pendingLosses} losing</span>}
                    </div>
                  </div>
                  {stats.potentialProfit > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>Potential</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#4ade80" }}>+{stats.potentialProfit.toFixed(2)} SOL</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Claimable Banner */}
            {stats.claimable > 0 && (
              <div className="glass-card" style={{ padding: "16px", marginBottom: "16px", background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#4ade80", marginBottom: "4px" }}>💰 Unclaimed Winnings!</div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>Go to My Bets to claim</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#4ade80" }}>+{stats.claimable.toFixed(2)} SOL</div>
                  </div>
                </div>
                <button onClick={() => router.push("/my-bets")} className="btn-primary" style={{ width: "100%", marginTop: "12px", padding: "10px" }}>
                  Claim Now →
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <div className="font-display neon-text-cyan" style={{ fontSize: "28px", fontWeight: 700 }}>{stats.winRate.toFixed(1)}%</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Win Rate</div>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <div className="font-display" style={{ fontSize: "28px", fontWeight: 700, color: stats.netProfit >= 0 ? "#4ade80" : "#f87171" }}>
                  {stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toFixed(2)}
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>SOL Profit</div>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <div className="font-display" style={{ fontSize: "28px", fontWeight: 700 }}>
                  <span style={{ color: "#4ade80" }}>{stats.wins}</span>
                  <span style={{ color: "#6b7280" }}>/</span>
                  <span style={{ color: "#f87171" }}>{stats.losses}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>W/L Record</div>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <div className="font-display" style={{ fontSize: "28px", fontWeight: 700, color: "#a855f7" }}>{stats.totalStaked.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>SOL Staked</div>
              </div>
            </div>

            {stats.badges.length > 0 && (
              <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
                <h3 className="font-display" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>🏅 Badges ({stats.badges.length})</h3>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {stats.badges.map((badge) => (
                    <div key={badge.id} style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(155,93,229,0.1)", border: "1px solid rgba(155,93,229,0.2)", textAlign: "center", minWidth: "100px" }}>
                      <div style={{ fontSize: "24px", marginBottom: "4px" }}>{badge.emoji}</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "white" }}>{badge.name}</div>
                      <div style={{ fontSize: "10px", color: "#6b7280" }}>{badge.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
              <h3 className="font-display" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>📊 Detailed Stats</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#9ca3af" }}>Total Bets</span>
                  <span style={{ fontWeight: 600 }}>{stats.totalBets}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#9ca3af" }}>Active</span>
                  <span style={{ fontWeight: 600, color: "#5eead4" }}>{stats.pending}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#9ca3af" }}>Awaiting Payout</span>
                  <span style={{ fontWeight: 600, color: "#fbbf24" }}>{stats.pendingWins + stats.pendingLosses}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#9ca3af" }}>Total Won</span>
                  <span style={{ fontWeight: 600, color: "#4ade80" }}>+{stats.totalWon.toFixed(2)} SOL</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#9ca3af" }}>Total Lost</span>
                  <span style={{ fontWeight: 600, color: "#f87171" }}>-{stats.totalLost.toFixed(2)} SOL</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ color: "#9ca3af" }}>Biggest Bet</span>
                  <span style={{ fontWeight: 600 }}>{stats.maxBet.toFixed(2)} SOL</span>
                </div>
              </div>
            </div>

            <button onClick={() => disconnect()} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Disconnect Wallet</button>
          </>
        )}
      </div>
      <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px", zIndex: 50 }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          <div className="nav-item" onClick={() => router.push("/")}><span style={{ fontSize: "18px" }}>🏠</span><span style={{ fontSize: "10px" }}>Home</span></div>
          <div className="nav-item" onClick={() => router.push("/my-bets")}><span style={{ fontSize: "18px" }}>📋</span><span style={{ fontSize: "10px" }}>My Bets</span></div>
          <div className="nav-item" onClick={() => router.push("/leaderboard")}><span style={{ fontSize: "18px" }}>🏆</span><span style={{ fontSize: "10px" }}>Leaderboard</span></div>
          <div className="nav-item active"><span style={{ fontSize: "18px" }}>👤</span><span style={{ fontSize: "10px" }}>Profile</span></div>
        </div>
      </nav>
    </div>
  );
}
