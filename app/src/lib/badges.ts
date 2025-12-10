import { BetData } from "./fetchUserBets";
import { MarketData } from "./fetchMarkets";

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
};

export interface ProfileStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
  totalStaked: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  maxBet: number;
  badges: Badge[];
}

export function calculateProfileStats(bets: BetData[], markets: MarketData[]): ProfileStats {
  let wins = 0, losses = 0, pending = 0;
  let totalWon = 0, totalLost = 0;
  const totalStaked = bets.reduce((sum, b) => sum + b.amount, 0);
  const maxBet = bets.length > 0 ? Math.max(...bets.map(b => b.amount)) : 0;

  for (const bet of bets) {
    const market = markets.find(m => m.pubkey === bet.market);
    if (!market || market.status === "open") {
      pending++;
      continue;
    }
    
    if (market.outcome === bet.side) {
      wins++;
      // Calculate payout (proportional share of total pool)
      const winnerPool = bet.side === "ship" ? market.shipPool : market.slipPool;
      const totalPool = market.shipPool + market.slipPool;
      if (winnerPool > 0) {
        const payout = (bet.amount / winnerPool) * totalPool;
        totalWon += payout;
      }
    } else {
      losses++;
      totalLost += bet.amount;
    }
  }

  const resolvedBets = wins + losses;
  const winRate = resolvedBets > 0 ? (wins / resolvedBets) * 100 : 0;
  const netProfit = totalWon - totalLost;

  // Calculate badges
  const earnedBadges: Badge[] = [];
  
  // Participation badges
  if (bets.length >= 1) earnedBadges.push(ALL_BADGES.first_blood);
  if (bets.length >= 10) earnedBadges.push(ALL_BADGES.regular);
  if (bets.length >= 50) earnedBadges.push(ALL_BADGES.veteran);
  if (bets.length >= 100) earnedBadges.push(ALL_BADGES.degen);
  
  // Win badges
  if (wins >= 1) earnedBadges.push(ALL_BADGES.winner);
  
  // Win rate badges (min 10 resolved bets)
  if (resolvedBets >= 10 && winRate >= 60) earnedBadges.push(ALL_BADGES.lucky);
  if (resolvedBets >= 20 && winRate >= 70) earnedBadges.push(ALL_BADGES.sharp);
  
  // Volume badges
  if (totalStaked >= 1) earnedBadges.push(ALL_BADGES.starter);
  if (totalStaked >= 10) earnedBadges.push(ALL_BADGES.player);
  if (totalStaked >= 100) earnedBadges.push(ALL_BADGES.whale);
  
  // Single bet badges
  if (maxBet >= 1) earnedBadges.push(ALL_BADGES.bold_move);
  if (maxBet >= 10) earnedBadges.push(ALL_BADGES.yolo);
  
  // Early adopter (everyone in beta)
  earnedBadges.push(ALL_BADGES.early_adopter);

  return {
    totalBets: bets.length,
    wins,
    losses,
    pending,
    winRate,
    totalStaked,
    totalWon,
    totalLost,
    netProfit,
    maxBet,
    badges: earnedBadges,
  };
}
