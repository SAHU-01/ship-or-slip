"use client";

import { useRouter } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface LeaderboardEntry { rank: number; address: string; displayName?: string; wins: number; losses: number; winRate: number; totalProfit: number; }

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, address: "7xKX...9fGh", displayName: "whale.sol", wins: 89, losses: 23, winRate: 79.5, totalProfit: 1247.5 },
  { rank: 2, address: "9mNP...3kLw", displayName: "degen_dev", wins: 67, losses: 31, winRate: 68.4, totalProfit: 892.3 },
  { rank: 3, address: "3pQR...8vXc", wins: 54, losses: 28, winRate: 65.9, totalProfit: 654.8 },
  { rank: 4, address: "5tYU...1nMb", displayName: "pr_predictor", wins: 48, losses: 32, winRate: 60.0, totalProfit: 423.1 },
  { rank: 5, address: "2wER...6jKf", wins: 41, losses: 29, winRate: 58.6, totalProfit: 312.7 },
  { rank: 6, address: "8zAS...4hGd", displayName: "solana_sage", wins: 38, losses: 27, winRate: 58.5, totalProfit: 287.4 },
  { rank: 7, address: "4xDF...2mLp", wins: 35, losses: 28, winRate: 55.6, totalProfit: 198.2 },
  { rank: 8, address: "6cVB...9qWs", wins: 32, losses: 26, winRate: 55.2, totalProfit: 156.8 },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const getRankEmoji = (rank: number) => { if (rank === 1) return "🥇"; if (rank === 2) return "🥈"; if (rank === 3) return "🥉"; return `#${rank}`; };
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { background: "linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,180,0,0.1) 100%)", border: "2px solid rgba(255,215,0,0.5)" };
    if (rank === 2) return { background: "linear-gradient(135deg, rgba(192,192,192,0.2) 0%, rgba(160,160,160,0.1) 100%)", border: "2px solid rgba(192,192,192,0.5)" };
    if (rank === 3) return { background: "linear-gradient(135deg, rgba(205,127,50,0.2) 0%, rgba(180,100,40,0.1) 100%)", border: "2px solid rgba(205,127,50,0.5)" };
    return {};
  };

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      <div className="orb-purple" style={{ width: "256px", height: "256px", top: "-64px", right: "-64px" }} />
      <div className="orb-cyan" style={{ width: "192px", height: "192px", bottom: "128px", left: "-64px" }} />
      <div className="relative z-10" style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 24px 120px 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "24px" }}>🚀</span><span className="font-display" style={{ fontSize: "20px", fontWeight: 700 }}>Ship or Slip</span></div>
          <WalletMultiButton />
        </header>
        <h1 className="font-display" style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>🏆 Leaderboard</h1>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>Top predictors ranked by profit</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          <div className="glass-card" style={{ padding: "20px", textAlign: "center", ...getRankStyle(2), marginTop: "24px" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>🥈</div><div className="font-display" style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>{MOCK_LEADERBOARD[1].displayName || MOCK_LEADERBOARD[1].address}</div><div className="neon-text-cyan font-display" style={{ fontSize: "20px", fontWeight: 700, marginTop: "8px" }}>+{MOCK_LEADERBOARD[1].totalProfit.toFixed(1)} SOL</div></div>
          <div className="glass-card" style={{ padding: "24px", textAlign: "center", ...getRankStyle(1) }}><div style={{ fontSize: "40px", marginBottom: "8px" }}>🥇</div><div className="font-display" style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>{MOCK_LEADERBOARD[0].displayName || MOCK_LEADERBOARD[0].address}</div><div className="neon-text-cyan font-display" style={{ fontSize: "24px", fontWeight: 700, marginTop: "8px" }}>+{MOCK_LEADERBOARD[0].totalProfit.toFixed(1)} SOL</div></div>
          <div className="glass-card" style={{ padding: "20px", textAlign: "center", ...getRankStyle(3), marginTop: "40px" }}><div style={{ fontSize: "28px", marginBottom: "8px" }}>🥉</div><div className="font-display" style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>{MOCK_LEADERBOARD[2].displayName || MOCK_LEADERBOARD[2].address}</div><div className="neon-text-cyan font-display" style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>+{MOCK_LEADERBOARD[2].totalProfit.toFixed(1)} SOL</div></div>
        </div>
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 100px 120px", padding: "12px 16px", background: "rgba(155,93,229,0.1)", borderBottom: "1px solid rgba(155,93,229,0.2)", fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", fontWeight: 600 }}><div>Rank</div><div>Player</div><div style={{ textAlign: "center" }}>W/L</div><div style={{ textAlign: "center" }}>Win %</div><div style={{ textAlign: "right" }}>Profit</div></div>
          {MOCK_LEADERBOARD.map((entry, i) => (
            <div key={entry.rank} style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 100px 120px", padding: "14px 16px", borderBottom: i < MOCK_LEADERBOARD.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{getRankEmoji(entry.rank)}</div>
              <div><div className="font-display" style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>{entry.displayName || entry.address}</div>{entry.displayName && <div style={{ fontSize: "11px", color: "#6b7280" }}>{entry.address}</div>}</div>
              <div style={{ textAlign: "center", fontSize: "13px" }}><span style={{ color: "#4ade80" }}>{entry.wins}</span><span style={{ color: "#6b7280" }}>/</span><span style={{ color: "#f87171" }}>{entry.losses}</span></div>
              <div style={{ textAlign: "center" }}><span className={entry.winRate >= 60 ? "neon-text-cyan" : ""} style={{ fontSize: "13px", fontWeight: 600 }}>{entry.winRate.toFixed(1)}%</span></div>
              <div style={{ textAlign: "right" }}><span className="font-display" style={{ fontSize: "14px", fontWeight: 700, color: "#4ade80" }}>+{entry.totalProfit.toFixed(1)}</span><span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "4px" }}>SOL</span></div>
            </div>
          ))}
        </div>
      </div>
      <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px", zIndex: 50 }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          <div className="nav-item" onClick={() => router.push("/")}><span style={{ fontSize: "18px" }}>🏠</span><span style={{ fontSize: "10px" }}>Home</span></div>
          <div className="nav-item" onClick={() => router.push("/my-bets")}><span style={{ fontSize: "18px" }}>📋</span><span style={{ fontSize: "10px" }}>My Bets</span></div>
          <div className="nav-item active"><span style={{ fontSize: "18px" }}>🏆</span><span style={{ fontSize: "10px" }}>Leaderboard</span></div>
          <div className="nav-item" onClick={() => router.push("/profile")}><span style={{ fontSize: "18px" }}>👤</span><span style={{ fontSize: "10px" }}>Profile</span></div>
        </div>
      </nav>
    </div>
  );
}
