"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createMarket } from "@/lib/marketService";
import { fetchAllMarkets, MarketData } from "@/lib/fetchMarkets";

const GitHubIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>);

function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ padding: "10px 20px", borderRadius: "8px", background: "rgba(155,93,229,0.5)", color: "white", fontSize: "14px" }}>Loading...</div>;
  return <WalletMultiButton />;
}

function MarketCard({ market }: { market: MarketData }) {
  const [timeLeft, setTimeLeft] = useState("--");
  const totalPool = market.shipPool + market.slipPool;
  const shipPct = totalPool > 0 ? Math.round((market.shipPool / totalPool) * 100) : 50;
  const slipPct = 100 - shipPct;
  useEffect(() => {
    const update = () => { const diff = market.deadline - Math.floor(Date.now() / 1000); if (diff <= 0) { setTimeLeft("ENDED"); return; } setTimeLeft(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`); };
    update(); const i = setInterval(update, 60000); return () => clearInterval(i);
  }, [market.deadline]);
  return (
    <div className="glass-card group" style={{ padding: "16px", display: "flex", flexDirection: "column", height: "100%", minHeight: "200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", color: "#c4b5fd", border: "1px solid rgba(155,93,229,0.3)" }}>PR #{market.prNumber}</span>
        <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: market.status === "open" ? "rgba(0,245,212,0.2)" : "rgba(239,68,68,0.2)", color: market.status === "open" ? "#5eead4" : "#fca5a5", border: `1px solid ${market.status === "open" ? "rgba(0,245,212,0.3)" : "rgba(239,68,68,0.3)"}` }}>⏱️ {timeLeft}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}><GitHubIcon /><span style={{ color: "#9ca3af", fontSize: "12px" }}>{market.repo}</span></div>
      <h3 className="font-display" style={{ fontSize: "14px", fontWeight: 600, color: "white", marginBottom: "12px", lineHeight: "1.3", minHeight: "36px" }}>PR #{market.prNumber} - {market.repo.split('/')[1] || market.repo}</h3>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}><span>🚀 <span className="neon-text-cyan">{shipPct}%</span></span><span><span className="neon-text-purple">{slipPct}%</span> 🕳️</span></div>
        <div style={{ height: "6px", borderRadius: "9999px", background: "#1f2937", overflow: "hidden", display: "flex" }}><div style={{ width: `${shipPct}%`, background: "linear-gradient(to right, #22d3ee, #06b6d4)" }} /><div style={{ width: `${slipPct}%`, background: "linear-gradient(to right, #a855f7, #9333ea)" }} /></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", paddingTop: "8px", borderTop: "1px solid rgba(0,245,212,0.2)", marginTop: "auto" }}><span style={{ color: "#9ca3af" }}><span style={{ color: "white", fontWeight: 600 }}>{totalPool.toFixed(2)}</span> SOL</span><span style={{ color: "#6b7280" }}>👥 {market.totalBettors}</span></div>
    </div>
  );
}

function CreateMarketModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [repo, setRepo] = useState(""); const [prNumber, setPrNumber] = useState(""); const [hours, setHours] = useState("24"); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  
  const handleSubmit = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !repo || !prNumber) return;
    setLoading(true); setError("");
    try {
      const deadline = Math.floor(Date.now() / 1000) + parseInt(hours) * 3600;
      const sig = await createMarket(connection, wallet, repo, parseInt(prNumber), deadline);
      alert(`✅ Market created!\nTX: ${sig.slice(0,20)}...`);
      onSuccess();
      onClose();
      setRepo(""); setPrNumber("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create market");
    } finally { setLoading(false); }
  };
  
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)" }}>
      <div className="glass-card" style={{ padding: "24px", width: "100%", maxWidth: "400px", margin: "16px" }}>
        <h2 className="font-display" style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>🆕 Create Market</h2>
        <div style={{ marginBottom: "16px" }}><label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>GitHub Repo (owner/repo)</label><input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="solana-labs/solana" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,212,0.3)", color: "white", outline: "none" }} /></div>
        <div style={{ marginBottom: "16px" }}><label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>PR Number</label><input type="number" value={prNumber} onChange={(e) => setPrNumber(e.target.value)} placeholder="12345" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,212,0.3)", color: "white", outline: "none" }} /></div>
        <div style={{ marginBottom: "20px" }}><label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>Deadline</label><select value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,212,0.3)", color: "white" }}><option value="6">6 hours</option><option value="12">12 hours</option><option value="24">24 hours</option><option value="48">48 hours</option></select></div>
        {error && <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}
        <div style={{ display: "flex", gap: "12px" }}><button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer" }}>Cancel</button><button onClick={handleSubmit} disabled={loading || !repo || !prNumber} className="btn-primary" style={{ flex: 1, padding: "12px" }}>{loading ? "Creating..." : "Create"}</button></div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { connection } = useConnection();
  const { connected } = useWallet();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllMarkets(connection);
    setMarkets(data);
    setLoading(false);
  }, [connection]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) loadMarkets(); }, [mounted, loadMarkets]);

  const totalBets = markets.reduce((sum, m) => sum + m.totalBettors, 0);
  const totalPooled = markets.reduce((sum, m) => sum + m.shipPool + m.slipPool, 0);

  if (!mounted) return <div className="min-h-screen circuit-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#6b7280" }}>Loading...</p></div>;

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      <div className="orb-purple" style={{ width: "320px", height: "320px", top: "-128px", right: "-128px" }} /><div className="orb-cyan" style={{ width: "256px", height: "256px", top: "33%", left: "-96px" }} />
      <div className="relative z-10" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 120px 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "48px" }}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "24px" }}>🚀</span><span className="font-display" style={{ fontSize: "20px", fontWeight: 700 }}>Ship or Slip</span></div><WalletButton /></header>
        <section style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", border: "1px solid rgba(155,93,229,0.3)", marginBottom: "16px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} /><span style={{ fontSize: "12px", color: "#c4b5fd" }}>Live on Solana Devnet</span></div>
          <h1 className="font-display" style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, marginBottom: "12px" }}><span className="neon-text-cyan">SHIP</span><span style={{ color: "white", margin: "0 12px" }}>or</span><span className="neon-text-purple">SLIP</span></h1>
          <p style={{ fontSize: "18px", color: "#d1d5db" }}>Dev Velocity Arcade</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "48px", marginTop: "24px" }}><div style={{ textAlign: "center" }}><div className="font-display neon-text-cyan" style={{ fontSize: "24px", fontWeight: 700 }}>{totalBets}</div><div style={{ fontSize: "11px", color: "#6b7280" }}>Total Bets</div></div><div style={{ textAlign: "center" }}><div className="font-display" style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>{totalPooled.toFixed(1)}</div><div style={{ fontSize: "11px", color: "#6b7280" }}>SOL Pooled</div></div></div>
        </section>
        <section style={{ marginBottom: "56px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}><h2 className="font-display" style={{ fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }}></span>Live Markets</h2>{connected && <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: "8px 16px", fontSize: "12px" }}>+ Create Market</button>}</div>
          {loading ? (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}><p style={{ color: "#6b7280" }}>Loading markets from chain...</p></div>
          ) : markets.length === 0 ? (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏜️</div>
              <p style={{ color: "#6b7280", marginBottom: "16px" }}>No markets yet</p>
              {connected && <button onClick={() => setShowCreateModal(true)} className="btn-primary">Create First Market</button>}
              {!connected && <p style={{ color: "#9ca3af", fontSize: "14px" }}>Connect wallet to create a market</p>}
            </div>
          ) : (
            <div className="markets-grid">{markets.map((m) => <Link key={m.pubkey} href={`/market/${m.pubkey}?repo=${encodeURIComponent(m.repo)}&pr=${m.prNumber}`} style={{ display: "block" }}><MarketCard market={m} /></Link>)}</div>
          )}
        </section>
        <section className="glass-card-purple" style={{ padding: "32px" }}><h2 className="font-display" style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "24px" }}>How It Works</h2><div className="how-it-works-grid">{[{ emoji: "1️⃣", title: "Pick a PR", desc: "Browse markets" },{ emoji: "2️⃣", title: "Make Your Call", desc: "🚀 SHIP or 🕳️ SLIP" },{ emoji: "3️⃣", title: "Stake SOL", desc: "On-chain bets" },{ emoji: "4️⃣", title: "Collect", desc: "Winners split pool" }].map((s, i) => <div key={i} style={{ textAlign: "center" }}><span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>{s.emoji}</span><h3 className="font-display" style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{s.title}</h3><p style={{ fontSize: "11px", color: "#6b7280" }}>{s.desc}</p></div>)}</div></section>
      </div>
      <CreateMarketModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={loadMarkets} />
      <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px", zIndex: 50 }}><div style={{ maxWidth: "400px", margin: "0 auto", display: "flex", justifyContent: "space-around" }}><div className="nav-item active" onClick={() => router.push("/")}><span style={{ fontSize: "18px" }}>🏠</span><span style={{ fontSize: "10px" }}>Home</span></div><div className="nav-item" onClick={() => router.push("/my-bets")}><span style={{ fontSize: "18px" }}>📋</span><span style={{ fontSize: "10px" }}>My Bets</span></div><div className="nav-item" onClick={() => router.push("/leaderboard")}><span style={{ fontSize: "18px" }}>🏆</span><span style={{ fontSize: "10px" }}>Leaderboard</span></div><div className="nav-item" onClick={() => router.push("/profile")}><span style={{ fontSize: "18px" }}>👤</span><span style={{ fontSize: "10px" }}>Profile</span></div></div></nav>
    </div>
  );
}
