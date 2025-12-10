"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const MOCK_MARKET = {
  repo: "solana-labs/solana",
  prTitle: "feat: Optimistic Confirmation & Turbine V2",
  prNumber: 12345,
  shipPool: 306.17,
  slipPool: 144.08,
};

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

export default function MarketPage() {
  const router = useRouter();
  const { connected } = useWallet();
  
  const [selectedSide, setSelectedSide] = useState<"ship" | "slip" | null>(null);
  const [stake, setStake] = useState("");
  const [timeLeft, setTimeLeft] = useState({ h: 4, m: 30, s: 15 });
  const [isPlacing, setIsPlacing] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);

  const market = MOCK_MARKET;
  const totalPool = market.shipPool + market.slipPool;
  const shipPct = Math.round((market.shipPool / totalPool) * 100);
  const slipPct = 100 - shipPct;
  const progress = 75;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) return { h: 0, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const getPayout = () => {
    if (!stake || !selectedSide) return "0.00";
    const num = parseFloat(stake);
    const pool = selectedSide === "ship" ? market.shipPool : market.slipPool;
    return ((num * totalPool) / pool).toFixed(2);
  };

  const handlePlaceBet = async () => {
    if (!selectedSide || !stake || !connected) return;
    setIsPlacing(true);
    await new Promise(r => setTimeout(r, 2000));
    setBetPlaced(true);
    setTimeout(() => setBetPlaced(false), 3000);
    setIsPlacing(false);
  };

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      <div className="orb-purple" style={{ width: "256px", height: "256px", top: "-64px", right: "-64px" }} />
      <div className="orb-cyan" style={{ width: "192px", height: "192px", bottom: "128px", left: "-64px" }} />

      {/* Success Modal */}
      {betPlaced && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "72px", marginBottom: "16px" }}>{selectedSide === "ship" ? "🚀" : "🕳️"}</div>
            <div className={`font-display ${selectedSide === "ship" ? "neon-text-cyan" : "neon-text-purple"}`} style={{ fontSize: "28px", fontWeight: 700 }}>BET PLACED!</div>
            <div style={{ color: "#9ca3af", marginTop: "8px" }}>Potential: +{getPayout()} SOL</div>
          </div>
        </div>
      )}

      <div className="relative z-10" style={{ maxWidth: "480px", margin: "0 auto", padding: "24px 24px 120px 24px" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <button 
            onClick={() => router.push("/")} 
            style={{ color: "#9ca3af", fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}
          >
            ← Back
          </button>
          <WalletMultiButton />
        </header>

        {/* PR Info Card */}
        <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <GitHubIcon />
            <span style={{ color: "#9ca3af", fontSize: "14px" }}>{market.repo}</span>
          </div>
          <h1 className="font-display" style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "8px", lineHeight: 1.3 }}>
            {market.prTitle}
          </h1>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>PR #{market.prNumber}</span>
        </div>

        {/* Timer Card */}
        <div className="glass-card" style={{ padding: "20px", marginBottom: "16px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "16px" }}>
            <span className="font-display" style={{ fontSize: "36px", fontWeight: 700 }}>{pad(timeLeft.h)}</span>
            <span className="font-display" style={{ fontSize: "28px", color: "#6b7280" }}>:</span>
            <span className="font-display" style={{ fontSize: "36px", fontWeight: 700 }}>{pad(timeLeft.m)}</span>
            <span className="font-display" style={{ fontSize: "28px", color: "#6b7280" }}>:</span>
            <span className="font-display" style={{ fontSize: "36px", fontWeight: 700 }}>{pad(timeLeft.s)}</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: "8px" }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
            <span className="neon-text-cyan">{progress}%</span>
            <span style={{ color: "#6b7280" }}>Time to deadline</span>
          </div>
        </div>

        {/* Ship/Slip Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <button 
            onClick={() => setSelectedSide("ship")} 
            className={`btn-ship ${selectedSide === "ship" ? "active" : ""}`}
            style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="font-display neon-text-cyan" style={{ fontSize: "16px", fontWeight: 700 }}>SHIP</span>
              <span style={{ fontSize: "20px" }}>🚀</span>
            </div>
            <div className="font-display" style={{ fontSize: "28px", fontWeight: 700, color: "white" }}>{shipPct}%</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>{market.shipPool.toFixed(1)} SOL</div>
          </button>
          
          <button 
            onClick={() => setSelectedSide("slip")} 
            className={`btn-slip ${selectedSide === "slip" ? "active" : ""}`}
            style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="font-display neon-text-purple" style={{ fontSize: "16px", fontWeight: 700 }}>SLIP</span>
              <span style={{ fontSize: "20px" }}>🕳️</span>
            </div>
            <div className="font-display" style={{ fontSize: "28px", fontWeight: 700, color: "white" }}>{slipPct}%</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>{market.slipPool.toFixed(1)} SOL</div>
          </button>
        </div>

        {/* Total Pool */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #9b5de5, #4ade80, #22d3ee)" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6b7280", fontSize: "12px", marginBottom: "2px" }}>Total Pooled:</p>
            <p className="font-display" style={{ fontSize: "22px", fontWeight: 700 }}>{totalPool.toFixed(2)} SOL</p>
          </div>
        </div>

        {/* Stake Input */}
        <div className="glass-card" style={{ padding: "16px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <input 
              type="number" 
              placeholder="Enter stake" 
              value={stake} 
              onChange={(e) => setStake(e.target.value)} 
              className="font-display"
              style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: "16px", width: "50%" }} 
              step="0.1" 
              min="0" 
            />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#9ca3af", fontSize: "14px" }}>{stake || "0.0"} SOL</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button onClick={() => setStake((p) => (parseFloat(p || "0") + 0.1).toFixed(1))} style={{ color: "#6b7280", fontSize: "12px", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>▲</button>
                <button onClick={() => setStake((p) => Math.max(0, parseFloat(p || "0") - 0.1).toFixed(1))} style={{ color: "#6b7280", fontSize: "12px", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>▼</button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {["0.1", "0.5", "1", "5"].map((amt) => (
            <button key={amt} onClick={() => setStake(amt)} style={{ flex: 1, padding: "8px", borderRadius: "8px", background: stake === amt ? "rgba(155,93,229,0.3)" : "rgba(255,255,255,0.05)", border: stake === amt ? "1px solid #9b5de5" : "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "12px", cursor: "pointer" }}>
              {amt} SOL
            </button>
          ))}
        </div>

        {/* Potential Payout */}
        {stake && selectedSide && (
          <div className="glass-card-purple" style={{ padding: "12px", marginBottom: "12px", textAlign: "center" }}>
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>Potential Payout: </span>
            <span className="font-display neon-text-purple" style={{ fontWeight: 700 }}>{getPayout()} SOL</span>
          </div>
        )}

        {/* Place Bet Button */}
        <button onClick={handlePlaceBet} disabled={!selectedSide || !stake || isPlacing || !connected} className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: "14px" }}>
          {!connected ? "CONNECT WALLET" : isPlacing ? "PLACING..." : "PLACE BET"}
        </button>

        {/* User Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "20px" }}>
          <div style={{ padding: "8px 16px", borderRadius: "9999px", background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.3)" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>⚙️ </span>
            <span style={{ fontSize: "12px", color: "white" }}>Maintainer</span>
          </div>
          <div style={{ padding: "8px 16px", borderRadius: "9999px", background: "rgba(155,93,229,0.1)", border: "1px solid rgba(155,93,229,0.3)" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>📈 </span>
            <span className="neon-text-cyan" style={{ fontSize: "12px" }}>62%</span>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px", zIndex: 50 }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          <div className="nav-item" onClick={() => router.push("/")}><span style={{ fontSize: "18px" }}>🏠</span><span style={{ fontSize: "10px" }}>Home</span></div>
          <div className="nav-item"><span style={{ fontSize: "18px" }}>📋</span><span style={{ fontSize: "10px" }}>My Bets</span></div>
          <div className="nav-item"><span style={{ fontSize: "18px" }}>🏆</span><span style={{ fontSize: "10px" }}>Leaderboard</span></div>
          <div className="nav-item"><span style={{ fontSize: "18px" }}>👤</span><span style={{ fontSize: "10px" }}>Profile</span></div>
        </div>
      </nav>
    </div>
  );
}
