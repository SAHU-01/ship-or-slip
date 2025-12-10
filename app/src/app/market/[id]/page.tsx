"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { placeBet, claimWinnings } from "@/lib/marketService";
import { fetchPRStatus, PRStatus } from "@/lib/githubStatus";
import { fetchAllMarkets, MarketData } from "@/lib/fetchMarkets";
import { fetchUserBets, BetData } from "@/lib/fetchUserBets";

function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ padding: "10px 20px", borderRadius: "8px", background: "rgba(155,93,229,0.5)", color: "white", fontSize: "14px" }}>Loading...</div>;
  return <WalletMultiButton />;
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "16px 24px", borderRadius: "12px", background: type === "success" ? "rgba(34, 197, 94, 0.95)" : "rgba(239, 68, 68, 0.95)", color: "white", fontWeight: 600, fontSize: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "24px" }}>{type === "success" ? "🎉" : "❌"}</span>{message}
    </div>
  );
}

export default function MarketPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const marketId = params.id as string;
  const repo = searchParams.get("repo") || "unknown/repo";
  const prNumber = parseInt(searchParams.get("pr") || "0");
  
  const [selectedSide, setSelectedSide] = useState<"ship" | "slip" | null>(null);
  const [amount, setAmount] = useState("0.1");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [prStatus, setPrStatus] = useState<PRStatus | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [userBet, setUserBet] = useState<BetData | null>(null);
  const [claiming, setClaiming] = useState(false);

  const loadData = useCallback(async () => {
    const [prData, markets] = await Promise.all([
      fetchPRStatus(repo, prNumber),
      fetchAllMarkets(connection)
    ]);
    setPrStatus(prData);
    const m = markets.find(m => m.pubkey === marketId);
    setMarket(m || null);
    
    if (wallet.publicKey) {
      const bets = await fetchUserBets(connection, wallet.publicKey);
      const bet = bets.find(b => b.market === marketId);
      setUserBet(bet || null);
    }
  }, [repo, prNumber, connection, marketId, wallet.publicKey]);

  useEffect(() => { loadData(); }, [loadData]);

  const isDecided = prStatus?.state === "merged" || prStatus?.state === "closed";
  const isResolved = market?.status === "resolved";
  const prOutcome = prStatus?.state === "merged" ? "ship" : "slip";
  
  const totalPool = market ? market.shipPool + market.slipPool : 0;
  const shipPct = totalPool > 0 && market ? Math.round((market.shipPool / totalPool) * 100) : 50;
  const slipPct = 100 - shipPct;

  const userWon = isResolved && userBet && market?.outcome === userBet.side;
  const userWillWin = isDecided && !isResolved && userBet && prOutcome === userBet.side;
  const canClaim = userWon && !userBet?.claimed;

  const handlePlaceBet = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !selectedSide) return;
    if (isDecided) { setToast({ message: "PR already decided!", type: "error" }); return; }
    setLoading(true);
    try {
      const sig = await placeBet(connection, wallet, repo, prNumber, selectedSide, parseFloat(amount));
      setToast({ message: `Yay! Your ${amount} SOL bet on ${selectedSide.toUpperCase()} was placed! 🚀`, type: "success" });
      setTimeout(() => router.push("/my-bets"), 2000);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to place bet", type: "error" });
    } finally { setLoading(false); }
  };

  const handleClaim = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !canClaim) return;
    setClaiming(true);
    try {
      const sig = await claimWinnings(connection, wallet, repo, prNumber);
      setToast({ message: `🎉 Winnings claimed!`, type: "success" });
      loadData();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to claim", type: "error" });
    } finally { setClaiming(false); }
  };

  return (
    <div className="min-h-screen circuit-bg relative overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="orb-purple" style={{ width: "320px", height: "320px", top: "-128px", right: "-128px" }} />
      <div className="orb-cyan" style={{ width: "256px", height: "256px", top: "33%", left: "-96px" }} />
      
      <div className="relative z-10" style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>← Back</button>
          <WalletButton />
        </header>

        {/* Market Info */}
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", color: "#c4b5fd", border: "1px solid rgba(155,93,229,0.3)" }}>PR #{prNumber}</span>
            {prStatus && (
              <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: prStatus.state === "open" ? "rgba(74,222,128,0.2)" : prStatus.state === "merged" ? "rgba(34,211,238,0.2)" : "rgba(239,68,68,0.2)", color: prStatus.state === "open" ? "#4ade80" : prStatus.state === "merged" ? "#22d3ee" : "#f87171", border: `1px solid ${prStatus.state === "open" ? "rgba(74,222,128,0.3)" : prStatus.state === "merged" ? "rgba(34,211,238,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                {prStatus.state === "open" ? "🟢 Open" : prStatus.state === "merged" ? "🚀 Merged" : "🕳️ Closed"}
              </span>
            )}
            {isResolved && (
              <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "9999px", background: "rgba(155,93,229,0.2)", color: "#c4b5fd", border: "1px solid rgba(155,93,229,0.3)" }}>✅ Resolved</span>
            )}
          </div>
          <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>{prStatus?.title || repo}</h1>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>{repo} {prStatus && `• by ${prStatus.author}`}</p>
        </div>

        {/* Outcome Banner when decided/resolved */}
        {(isDecided || isResolved) && (
          <div className="glass-card" style={{ padding: "24px", marginBottom: "24px", background: (isResolved ? market?.outcome : prOutcome) === "ship" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", borderColor: (isResolved ? market?.outcome : prOutcome) === "ship" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>{(isResolved ? market?.outcome : prOutcome) === "ship" ? "🚀" : "🕳️"}</div>
              <h2 className="font-display" style={{ fontSize: "24px", fontWeight: 700, color: (isResolved ? market?.outcome : prOutcome) === "ship" ? "#4ade80" : "#f87171", marginBottom: "8px" }}>
                {isResolved ? (market?.outcome === "ship" ? "SHIPPED!" : "SLIPPED!") : (prOutcome === "ship" ? "PR MERGED!" : "PR CLOSED!")}
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                {isResolved ? "Market resolved. Winners can claim!" : "Betting locked. Awaiting resolution."}
              </p>
            </div>
          </div>
        )}

        {/* Pool Stats */}
        {market && (
          <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
            <h3 className="font-display" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>📊 Pool Stats</h3>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                <span>🚀 SHIP <span style={{ color: "#22d3ee", fontWeight: 600 }}>{shipPct}%</span></span>
                <span><span style={{ color: "#a855f7", fontWeight: 600 }}>{slipPct}%</span> SLIP 🕳️</span>
              </div>
              <div style={{ height: "12px", borderRadius: "9999px", background: "#1f2937", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${shipPct}%`, background: "linear-gradient(to right, #22d3ee, #06b6d4)", transition: "width 0.3s" }} />
                <div style={{ width: `${slipPct}%`, background: "linear-gradient(to right, #a855f7, #9333ea)", transition: "width 0.3s" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div style={{ textAlign: "center", padding: "12px", background: "rgba(34,211,238,0.1)", borderRadius: "8px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#22d3ee" }}>{market.shipPool.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>SHIP Pool</div>
              </div>
              <div style={{ textAlign: "center", padding: "12px", background: "rgba(168,85,247,0.1)", borderRadius: "8px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#a855f7" }}>{market.slipPool.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>SLIP Pool</div>
              </div>
              <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>{market.totalBettors}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Bettors</div>
              </div>
            </div>
          </div>
        )}

        {/* User's Bet Status */}
        {userBet && (
          <div className="glass-card" style={{ padding: "20px", marginBottom: "24px", background: userWon || userWillWin ? "rgba(74,222,128,0.1)" : (isDecided || isResolved) ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.02)" }}>
            <h3 className="font-display" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>🎫 Your Bet</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "32px" }}>{userBet.side === "ship" ? "🚀" : "🕳️"}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "18px", color: userBet.side === "ship" ? "#22d3ee" : "#a855f7" }}>{userBet.side.toUpperCase()}</div>
                  <div style={{ fontSize: "14px", color: "#9ca3af" }}>{userBet.amount.toFixed(2)} SOL</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {isResolved ? (
                  <>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: userWon ? "#4ade80" : "#f87171" }}>
                      {userWon ? "WON! 🎉" : "LOST 😢"}
                    </div>
                    {canClaim && (
                      <button onClick={handleClaim} disabled={claiming} className="btn-primary" style={{ marginTop: "8px", padding: "8px 16px", fontSize: "14px" }}>
                        {claiming ? "..." : "💰 Claim Winnings"}
                      </button>
                    )}
                    {userWon && userBet.claimed && (
                      <div style={{ fontSize: "12px", color: "#4ade80", marginTop: "4px" }}>✓ Claimed</div>
                    )}
                  </>
                ) : isDecided ? (
                  <div style={{ fontSize: "16px", fontWeight: 700, color: userWillWin ? "#4ade80" : "#f87171" }}>
                    {userWillWin ? "WINNING! 🎉" : "LOSING 😢"}
                  </div>
                ) : (
                  <div style={{ fontSize: "14px", color: "#fbbf24" }}>⏳ Pending</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Betting UI - only if PR is open and user hasn't bet */}
        {!isDecided && !isResolved && !userBet && wallet.connected && (
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 className="font-display" style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Place Your Bet</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <button onClick={() => setSelectedSide("ship")} style={{ padding: "20px", borderRadius: "12px", border: selectedSide === "ship" ? "2px solid #22d3ee" : "2px solid rgba(255,255,255,0.1)", background: selectedSide === "ship" ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🚀</div>
                <div className="font-display" style={{ fontSize: "18px", fontWeight: 700, color: "#22d3ee" }}>SHIP</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>PR will merge</div>
              </button>
              <button onClick={() => setSelectedSide("slip")} style={{ padding: "20px", borderRadius: "12px", border: selectedSide === "slip" ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.1)", background: selectedSide === "slip" ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🕳️</div>
                <div className="font-display" style={{ fontSize: "18px", fontWeight: 700, color: "#a855f7" }}>SLIP</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>PR will close</div>
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "8px" }}>Bet Amount (SOL)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["0.05", "0.1", "0.5", "1"].map((val) => (
                  <button key={val} onClick={() => setAmount(val)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: amount === val ? "1px solid #22d3ee" : "1px solid rgba(255,255,255,0.1)", background: amount === val ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: "14px" }}>{val}</button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Custom" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,212,0.3)", color: "white", marginTop: "8px", outline: "none" }} />
            </div>

            <button onClick={handlePlaceBet} disabled={loading || !selectedSide || !amount || parseFloat(amount) < 0.01} className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: "16px", opacity: (!selectedSide || loading) ? 0.5 : 1 }}>
              {loading ? "🎰 Placing Bet..." : `Bet ${amount} SOL on ${selectedSide?.toUpperCase() || "..."}`}
            </button>
          </div>
        )}

        {/* Already bet message */}
        {!isDecided && !isResolved && userBet && (
          <div className="glass-card" style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
            <p style={{ color: "#9ca3af" }}>You've already placed your bet on this market!</p>
          </div>
        )}

        {/* Connect wallet prompt */}
        {!wallet.connected && !isDecided && !isResolved && (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "#6b7280", marginBottom: "16px" }}>Connect wallet to place a bet</p>
            <WalletButton />
          </div>
        )}

        {/* Back button for decided markets */}
        {(isDecided || isResolved) && !userBet && (
          <div style={{ textAlign: "center" }}>
            <button onClick={() => router.push("/")} className="btn-primary" style={{ padding: "12px 24px" }}>
              ← Browse Markets
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
