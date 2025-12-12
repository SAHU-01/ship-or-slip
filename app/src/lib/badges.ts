import { BetData } from "./fetchUserBets";
import { MarketData } from "./fetchMarkets";
import { PRStatus } from "./githubStatus";

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

export const ALL_BADGES: Record<string, Badge> = {
  first_blood: { id: "first_blood", name: "First Blood", emoji: "🩸", desc: "Placed first bet" },
  regular: { id: "regular", name: "Regular", emoji: "🎯", desc: "Placed 10 bets" },
  veteran: { id: "veteran", name: "Veteran", emoji: "⭐", desc: "Placed 50 bets" },
  degen: { id: "degen", name: "Degen", emoji: "💎", desc: "Placed 100 bets" },
  winner: { id: "winner", name: "Winner", emoji: "✅", desc: "Won first bet" },
  on_fire: { id: "on_fire", name: "On Fire", emoji: "🔥", desc: "5 win streak" },
  lucky: { id: "lucky", name: "Lucky", emoji: "🍀", desc: "60%+ win rate" },
  sharp: { id: "sharp", name: "Sharp", emoji: "🎯", desc: "70%+ win rate" },
  starter: { id: "starter", name: "Starter", emoji: "🌱", desc: "Staked 1 SOL" },
  player: { id: "player", name: "Player", emoji: "🎲", desc: "Staked 10 SOL" },
  whale: { id: "whale", name: "Whale", emoji: "🐋", desc: "Staked 100 SOL" },
  bold_move: { id: "bold_move", name: "Bold Move", emoji: "🎰", desc: "Bet 1+ SOL once" },
  yolo: { id: "yolo", name: "YOLO", emoji: "🚀", desc: "Bet 10+ SOL once" },
  early_adopter: { id: "early_adopter", name: "Early Adopter", emoji: "🌅", desc: "Joined during beta" },
  shipper: { id: "shipper", name: "Shipper", emoji: "🚀", desc: "Won a SHIP bet" },
  slipper: { id: "slipper", name: "Slipper", emoji: "🕳️", desc: "Won a SLIP bet" },
};

export interface BetWithContext {
  bet: BetData;
  market?: MarketData;
  prStatus?: PRStatus | null;
}

export interface ProfileStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  pendingWins: number;
  pendingLosses: number;
  winRate: number;
  totalStaked: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  potentialProfit: number;
  maxBet: number;
  badges: Badge[];
  claimable: number;
}

export function calculateProfileStats(bets: BetWithContext[]): ProfileStats {
  let wins = 0, losses = 0, pending = 0, pendingWins = 0, pendingLosses = 0;
  let totalWon = 0, totalLost = 0, potentialProfit = 0, claimable = 0;
  const totalStaked = bets.reduce((sum, b) => sum + b.bet.amount, 0);
  const maxBet = bets.length > 0 ? Math.max(...bets.map(b => b.bet.amount)) : 0;
  
  let hasShipWin = false, hasSlipWin = false;

  for (const { bet, market, prStatus } of bets) {
    if (!market) {
      pending++;
      continue;
    }
    
    if (market.status === "resolved") {
      if (market.outcome === bet.side) {
        wins++;
        const winnerPool = bet.side === "ship" ? market.shipPool : market.slipPool;
        const totalPool = market.shipPool + market.slipPool;
        if (winnerPool > 0) {
          const payout = (bet.amount / winnerPool) * totalPool;
          totalWon += payout;
          if (!bet.claimed) claimable += payout - bet.amount;
        }
        if (bet.side === "ship") hasShipWin = true;
        if (bet.side === "slip") hasSlipWin = true;
      } else {
        losses++;
        totalLost += bet.amount;
      }
    } else if (prStatus?.state === "merged" || prStatus?.state === "closed") {
      const prOutcome = prStatus.state === "merged" ? "ship" : "slip";
      if (prOutcome === bet.side) {
        pendingWins++;
        const winnerPool = bet.side === "ship" ? market.shipPool : market.slipPool;
        const totalPool = market.shipPool + market.slipPool;
        if (winnerPool > 0) {
          const payout = (bet.amount / winnerPool) * totalPool;
          potentialProfit += payout - bet.amount;
        }
      } else {
        pendingLosses++;
      }
    } else {
      pending++;
    }
  }

  const resolvedBets = wins + losses;
  const winRate = resolvedBets > 0 ? (wins / resolvedBets) * 100 : 0;
  const netProfit = totalWon - totalLost - totalStaked;

  const earnedBadges: Badge[] = [];
  
  if (bets.length >= 1) earnedBadges.push(ALL_BADGES.first_blood);
  if (bets.length >= 10) earnedBadges.push(ALL_BADGES.regular);
  if (bets.length >= 50) earnedBadges.push(ALL_BADGES.veteran);
  if (bets.length >= 100) earnedBadges.push(ALL_BADGES.degen);
  
  if (wins >= 1) earnedBadges.push(ALL_BADGES.winner);
  if (hasShipWin) earnedBadges.push(ALL_BADGES.shipper);
  if (hasSlipWin) earnedBadges.push(ALL_BADGES.slipper);
  
  if (resolvedBets >= 10 && winRate >= 60) earnedBadges.push(ALL_BADGES.lucky);
  if (resolvedBets >= 20 && winRate >= 70) earnedBadges.push(ALL_BADGES.sharp);
  
  if (totalStaked >= 1) earnedBadges.push(ALL_BADGES.starter);
  if (totalStaked >= 10) earnedBadges.push(ALL_BADGES.player);
  if (totalStaked >= 100) earnedBadges.push(ALL_BADGES.whale);
  
  if (maxBet >= 1) earnedBadges.push(ALL_BADGES.bold_move);
  if (maxBet >= 10) earnedBadges.push(ALL_BADGES.yolo);
  
  earnedBadges.push(ALL_BADGES.early_adopter);

  return {
    totalBets: bets.length,
    wins,
    losses,
    pending,
    pendingWins,
    pendingLosses,
    winRate,
    totalStaked,
    totalWon,
    totalLost,
    netProfit,
    potentialProfit,
    maxBet,
    badges: earnedBadges,
    claimable,
  };
}
