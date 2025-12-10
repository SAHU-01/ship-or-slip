"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const MOCK_PROFILE = { displayName: "anon_predictor", rank: 42, joinedAt: "Nov 2024", stats: { wins: 21, losses: 13, winRate: 61.8, totalProfit: 127.5, currentStreak: 3 }, badges: [{ id: "early", name: "Early Adopter", emoji: "🌅", desc: "Joined during beta" },{ id: "streak5", name: "Hot Streak", emoji: "🔥", desc: "5 wins in a row" },{ id: "whale", name: "Mini Whale", emoji: "🐋", desc: "Bet 10+ SOL at once" }], recentActivity: [{ type: "win", market: "solana-labs/solana #12345", amount: 3.2, time: "2h ago" },{ type: "bet", market: "coral-xyz/anchor #2891", amount: 1.0, time: "5h ago" },{ type: "loss", market: "jito-labs/jito #456", amount: 2.0, time: "1d ago" }] };

export default function ProfilePage() {
  const router = useRouter();
  const { connected, publicKey, disconnect } = useWallet();

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
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}><div style={{ fontSize: "64px", marginBottom: "16px" }}>👤</div><h2 className="font-display" style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Your Profile</h2><p style={{ color: "#9ca3af", marginBottom: "24px" }}>Connect your wallet to view your profile</p><WalletMultiButton /></div>
        ) : (
          <>
            <div className="glass-card" style={{ padding: "24px", marginBottom: "16px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #9b5de5, #00f5d4)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>👤</div>
              <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>{MOCK_PROFILE.displayName}</h1>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "12px" }}>{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                <div style={{ padding: "6px 16px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", border: "1px solid rgba(155,93,229,0.3)" }}><span style={{ fontSize: "12px", color: "#c4b5fd" }}>Rank #{MOCK_PROFILE.rank}</span></div>
                <div style={{ padding: "6px 16px", borderRadius: "9999px", background: "rgba(0,245,212,0.2)", border: "1px solid rgba(0,245,212,0.3)" }}><span style={{ fontSize: "12px", color: "#5eead4" }}>Since {MOCK_PROFILE.joinedAt}</span></div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}><div className="font-display neon-text-cyan" style={{ fontSize: "28px", fontWeight: 700 }}>{MOCK_PROFILE.stats.winRate.toFixed(1)}%</div><div style={{ fontSize: "11px", color: "#6b7280" }}>Win Rate</div></div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}><div className="font-display" style={{ fontSize: "28px", fontWeight: 700, color: "#4ade80" }}>+{MOCK_PROFILE.stats.totalProfit.toFixed(1)}</div><div style={{ fontSize: "11px", color: "#6b7280" }}>SOL Profit</div></div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}><div className="font-display" style={{ fontSize: "28px", fontWeight: 700 }}><span style={{ color: "#4ade80" }}>{MOCK_PROFILE.stats.wins}</span><span style={{ color: "#6b7280" }}>/</span><span style={{ color: "#f87171" }}>{MOCK_PROFILE.stats.losses}</span></div><div style={{ fontSize: "11px", color: "#6b7280" }}>W/L Record</div></div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}><div className="font-display neon-text-purple" style={{ fontSize: "28px", fontWeight: 700 }}>{MOCK_PROFILE.stats.currentStreak}🔥</div><div style={{ fontSize: "11px", color: "#6b7280" }}>Win Streak</div></div>
            </div>
            <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
              <h3 className="font-display" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>🏅 Badges</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {MOCK_PROFILE.badges.map((badge) => (<div key={badge.id} style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(155,93,229,0.1)", border: "1px solid rgba(155,93,229,0.2)", textAlign: "center" }}><div style={{ fontSize: "24px", marginBottom: "4px" }}>{badge.emoji}</div><div style={{ fontSize: "12px", fontWeight: 600, color: "white" }}>{badge.name}</div><div style={{ fontSize: "10px", color: "#6b7280" }}>{badge.desc}</div></div>))}
              </div>
            </div>
            <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
              <h3 className="font-display" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>📊 Recent Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {MOCK_PROFILE.recentActivity.map((activity, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}><div style={{ display: "flex", alignItems: "center", gap: "12px" }}><span style={{ fontSize: "20px" }}>{activity.type === "win" ? "✅" : activity.type === "loss" ? "❌" : "🎲"}</span><div><div style={{ fontSize: "13px", color: "white" }}>{activity.market}</div><div style={{ fontSize: "11px", color: "#6b7280" }}>{activity.time}</div></div></div><div style={{ fontWeight: 600, color: activity.type === "win" ? "#4ade80" : activity.type === "loss" ? "#f87171" : "#9ca3af" }}>{activity.type === "win" ? "+" : activity.type === "loss" ? "-" : ""}{activity.amount} SOL</div></div>))}
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
