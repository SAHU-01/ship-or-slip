"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { placeBet } from "@/lib/marketService";

function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ padding: "10px 20px", borderRadius: "8px", background: "rgba(155,93,229,0.5)", color: "white", fontSize: "14px" }}>Loading...</div>;
  return <WalletMultiButton />;
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      top: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 200,
      padding: "16px 24px",
      borderRadius: "12px",
      background: type === "success" ? "rgba(34, 197, 94, 0.95)" : "rgba(239, 68, 68, 0.95)",
      color: "white",
      fontWeight: 600,
      fontSize: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      animation: "slideDown 0.3s ease-out",
    }}>
      <span style={{ fontSize: "24px" }}>{type === "success" ? "🎉" : "❌"}</span>
      {message}
    </div>
  );
}

export default function MarketPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const repo = searchParams.get("repo") || "unknown/repo";
  const prNumber = parseInt(searchParams.get("pr") || "0");
  
  const [selectedSide, setSelectedSide] = useState<"ship" | "slip" | null>(null);
  const [amount, setAmount] = useState("0.1");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handlePlaceBet = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !selectedSide) return;
    setLoading(true);
    setToast(null);
    try {
      const sig = await placeBet(connection, wallet, repo, prNumber, selectedSide, parseFloat(amount));
      setToast({ message: `Yay! Your ${amount} SOL bet on ${selectedSide.toUpperCase()} was placed! 🚀`, type: "success" });
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/my-bets");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || "Failed to place bet", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="orb-purple" style={{ width: "320px", height: "320px", top: "-128px", right: "-128px" }} />
      <div className="orb-cyan" style={{ width: "256px", height: "256px", top: "33%", left: "-96px" }} />
      
      <div className="relative z-10" style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            ← Back
          </button>
          <WalletButton />
        </header>

        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", color: "#c4b5fd", border: "1px solid rgba(155,93,229,0.3)" }}>PR #{prNumber}</span>
          </div>
          <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>{repo}</h1>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Will this PR ship or slip?</p>
        </div>

        {!wallet.connected ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "#6b7280", marginBottom: "16px" }}>Connect wallet to place a bet</p>
            <WalletButton />
          </div>
        ) : (
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 className="font-display" style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Place Your Bet</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <button
                onClick={() => setSelectedSide("ship")}
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  border: selectedSide === "ship" ? "2px solid #22d3ee" : "2px solid rgba(255,255,255,0.1)",
                  background: selectedSide === "ship" ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🚀</div>
                <div className="font-display" style={{ fontSize: "18px", fontWeight: 700, color: "#22d3ee" }}>SHIP</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>PR will merge</div>
              </button>
              
              <button
                onClick={() => setSelectedSide("slip")}
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  border: selectedSide === "slip" ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.1)",
                  background: selectedSide === "slip" ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🕳️</div>
                <div className="font-display" style={{ fontSize: "18px", fontWeight: 700, color: "#a855f7" }}>SLIP</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>PR will close</div>
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "8px" }}>Bet Amount (SOL)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["0.05", "0.1", "0.5", "1"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: amount === val ? "1px solid #22d3ee" : "1px solid rgba(255,255,255,0.1)",
                      background: amount === val ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.05)",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom amount"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(0,245,212,0.3)",
                  color: "white",
                  marginTop: "8px",
                  outline: "none",
                }}
              />
            </div>

            <button
              onClick={handlePlaceBet}
              disabled={loading || !selectedSide || !amount || parseFloat(amount) < 0.01}
              className="btn-primary"
              style={{ width: "100%", padding: "16px", fontSize: "16px", opacity: (!selectedSide || loading) ? 0.5 : 1 }}
            >
              {loading ? "🎰 Placing Bet..." : `Bet ${amount} SOL on ${selectedSide?.toUpperCase() || "..."}`}
            </button>
          </div>
        )}
      </div>

      <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px", zIndex: 50 }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          <div className="nav-item" onClick={() => router.push("/")}><span style={{ fontSize: "18px" }}>🏠</span><span style={{ fontSize: "10px" }}>Home</span></div>
          <div className="nav-item" onClick={() => router.push("/my-bets")}><span style={{ fontSize: "18px" }}>📋</span><span style={{ fontSize: "10px" }}>My Bets</span></div>
          <div className="nav-item" onClick={() => router.push("/leaderboard")}><span style={{ fontSize: "18px" }}>🏆</span><span style={{ fontSize: "10px" }}>Leaderboard</span></div>
          <div className="nav-item" onClick={() => router.push("/profile")}><span style={{ fontSize: "18px" }}>👤</span><span style={{ fontSize: "10px" }}>Profile</span></div>
        </div>
      </nav>
    </div>
  );
}
