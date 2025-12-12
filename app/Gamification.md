# 🎮 Ship or Slip - Gamification System

> Turn GitHub predictions into an addictive game with badges, stats, and leaderboards!

## Overview

Ship or Slip isn't just a prediction market—it's a **Dev Velocity Arcade**. We've gamified the entire experience to make betting on PRs engaging, competitive, and rewarding.

---

## 🏅 Badge System

Earn badges as you participate! Badges are displayed on your profile and show your betting prowess.

### 📊 Participation Badges

| Badge | Name | Requirement | Description |
|-------|------|-------------|-------------|
| 🩸 | **First Blood** | Place 1 bet | Welcome to the arena! |
| 🎯 | **Regular** | Place 10 bets | You're getting the hang of this |
| ⭐ | **Veteran** | Place 50 bets | A seasoned predictor |
| 💎 | **Degen** | Place 100 bets | You live for this |

### 🏆 Win Badges

| Badge | Name | Requirement | Description |
|-------|------|-------------|-------------|
| ✅ | **Winner** | Win 1 bet | First taste of victory |
| 🚀 | **Shipper** | Win a SHIP bet | You believe in devs |
| 🕳️ | **Slipper** | Win a SLIP bet | Healthy skepticism pays |
| 🔥 | **On Fire** | 5 win streak | Unstoppable! |

### 📈 Win Rate Badges

| Badge | Name | Requirement | Description |
|-------|------|-------------|-------------|
| 🍀 | **Lucky** | 60%+ win rate (10+ bets) | Fortune favors you |
| 🎯 | **Sharp** | 70%+ win rate (20+ bets) | Professional predictor |

### 💰 Volume Badges

| Badge | Name | Requirement | Description |
|-------|------|-------------|-------------|
| 🌱 | **Starter** | Stake 1 SOL total | Dipping your toes |
| 🎲 | **Player** | Stake 10 SOL total | Serious player |
| 🐋 | **Whale** | Stake 100 SOL total | Big fish energy |

### 🎰 Single Bet Badges

| Badge | Name | Requirement | Description |
|-------|------|-------------|-------------|
| 🎰 | **Bold Move** | Bet 1+ SOL once | High conviction play |
| 🚀 | **YOLO** | Bet 10+ SOL once | All in! |

### ⭐ Special Badges

| Badge | Name | Requirement | Description |
|-------|------|-------------|-------------|
| 🌅 | **Early Adopter** | Join during beta | OG status |
| 👑 | **Market Maker** | Create 5 markets | Building the arena |
| 🎪 | **Influencer** | Markets you created got 50+ bets | Your markets are popular |

---

## 📊 Profile Statistics

Your profile tracks comprehensive stats derived entirely from on-chain data:

### Core Stats

| Stat | Description |
|------|-------------|
| **Total Bets** | Number of bets placed |
| **W/L Record** | Wins vs Losses |
| **Win Rate** | Percentage of winning bets |
| **SOL Staked** | Total amount wagered |
| **SOL Profit** | Net profit/loss |

### Advanced Stats

| Stat | Description |
|------|-------------|
| **Biggest Bet** | Largest single bet amount |
| **Total Won** | Gross winnings |
| **Total Lost** | Gross losses |
| **Active Bets** | Currently open positions |
| **Pending Payouts** | Awaiting oracle resolution |

### Pending States

We track bets that are "decided" but not yet resolved:

- **Pending Wins** - PR merged/closed in your favor, awaiting oracle
- **Pending Losses** - PR merged/closed against you, awaiting oracle
- **Potential Profit** - Estimated payout from pending wins

---

## 🏆 Leaderboard System

### Rankings

Players are ranked by multiple criteria:

1. **Net Profit** - Total SOL earned
2. **Win Rate** - Percentage (min 10 bets)
3. **Volume** - Total SOL staked
4. **Badges** - Number of badges earned

### Leaderboard Tiers (Future)

| Tier | Requirement | Perks |
|------|-------------|-------|
| 🥉 Bronze | Top 50% | Basic profile flair |
| 🥈 Silver | Top 25% | Silver badge |
| 🥇 Gold | Top 10% | Gold badge + reduced fees |
| 💎 Diamond | Top 1% | Diamond badge + fee share |

---

## 🎯 XP System (Future Roadmap)

Planned experience point system:

### XP Sources

| Action | XP Reward |
|--------|-----------|
| Place bet | 10 XP |
| Win bet | 50 XP |
| Create market | 25 XP |
| First bet of the day | 20 XP bonus |
| Win streak (3+) | 2x XP multiplier |

### Levels

| Level | XP Required | Unlocks |
|-------|-------------|---------|
| 1-10 | 0-1000 | Basic features |
| 11-25 | 1000-5000 | Custom profile |
| 26-50 | 5000-15000 | Exclusive badges |
| 51-100 | 15000-50000 | Fee discounts |
| 100+ | 50000+ | Governance voting |

---

## 🔄 Real-Time Status Integration

### PR Status Badges

Markets show live GitHub status:

| Status | Badge | Meaning |
|--------|-------|---------|
| 🟢 Open | PR is open | Betting allowed |
| 🚀 Merged | PR merged | Betting locked, SHIP wins |
| 🕳️ Closed | PR closed | Betting locked, SLIP wins |

### Bet Status

Your bets show real-time outcomes:

| Status | Display | Meaning |
|--------|---------|---------|
| Active | ⏳ Pending | PR still open |
| Winning | 🎉 WINNING | PR decided in your favor |
| Losing | 😢 LOSING | PR decided against you |
| Won | ✅ WON | Resolved, claim available |
| Lost | ❌ LOST | Resolved, better luck next time |
| Claimed | ✓ Claimed | Winnings collected |

---

## 💾 Data Architecture

All gamification data is derived from on-chain accounts:

### Market Account
```
- repo: string
- prNumber: u64
- deadline: i64
- shipPool: u64
- slipPool: u64
- totalBettors: u32
- status: Open | Resolved
- outcome: Pending | Ship | Slip
```

### Bet Account
```
- market: Pubkey
- bettor: Pubkey
- side: Ship | Slip
- amount: u64
- claimed: bool
```

### Stats Calculation

Stats are computed client-side from on-chain data:
1. Fetch all user's Bet accounts
2. Fetch corresponding Market accounts
3. Query GitHub API for PR status
4. Calculate wins/losses/pending
5. Derive badges from thresholds

---

## 🚀 Future Gamification Features

### Season System
- 3-month competitive seasons
- Season-specific badges
- Reset leaderboards each season
- Season rewards for top players

### Achievements
- Daily challenges ("Place 3 bets today")
- Weekly missions ("Win 5 bets this week")
- Monthly goals ("Reach 70% win rate")

### Social Features
- Follow other predictors
- Copy trading (mirror bets)
- Team competitions
- Prediction leagues

### NFT Badges
- Mint badges as NFTs
- Trade rare badges
- Display in Solana wallets
- Cross-platform recognition

---

## 📱 UI Components

### Profile Card
```
┌─────────────────────────────────┐
│         🎰 Predictor            │
│         8jgN...yoqm             │
│  [1 Bets] [2 Badges] [Beta]     │
├─────────────────────────────────┤
│  Win Rate    │    SOL Profit    │
│    0.0%      │     +0.00        │
├─────────────────────────────────┤
│   W/L Record │   SOL Staked     │
│     0/0      │      0.05        │
└─────────────────────────────────┘
```

### Badge Display
```
┌──────────┬──────────┬──────────┐
│    🩸    │    🌅    │    🌱    │
│  First   │  Early   │ Starter  │
│  Blood   │ Adopter  │          │
└──────────┴──────────┴──────────┘
```

### Bet Card (History)
```
┌─────────────────────────────────┐
│ owner/repo              🚀 Merged│
│ PR #123                ⏳ Pending │
├─────────────────────────────────┤
│ 🚀 SHIP  0.05 SOL    WINNING 🎉 │
└─────────────────────────────────┘
```

---

## 🎨 Design Philosophy

1. **On-Chain First** - All core data lives on Solana
2. **Real-Time** - GitHub integration for instant status
3. **Progressive** - Earn more as you participate
4. **Visual** - Emojis and colors for quick recognition
5. **Fair** - Badges based on verifiable on-chain actions

---

## 📚 Integration Guide

### Fetching User Stats

```typescript
import { calculateProfileStats } from "@/lib/badges";

const bets = await fetchUserBets(connection, publicKey);
const markets = await fetchAllMarkets(connection);

const betsWithContext = await Promise.all(
  bets.map(async (bet) => {
    const market = markets.find(m => m.pubkey === bet.market);
    const prStatus = await fetchPRStatus(market.repo, market.prNumber);
    return { bet, market, prStatus };
  })
);

const stats = calculateProfileStats(betsWithContext);
// stats.badges, stats.winRate, stats.netProfit, etc.
```

### Adding New Badges

```typescript
// In badges.ts
export const ALL_BADGES = {
  // ... existing badges
  new_badge: { 
    id: "new_badge", 
    name: "New Badge", 
    emoji: "🆕", 
    desc: "Achievement unlocked!" 
  },
};

// In calculateProfileStats()
if (someCondition) {
  earnedBadges.push(ALL_BADGES.new_badge);
}
```

---

## 🤝 Contributing

Want to add new badges or gamification features? 

1. Fork the repo
2. Add badge definition to `badges.ts`
3. Add earning logic to `calculateProfileStats()`
4. Update this documentation
5. Submit a PR (and bet on whether it ships! 🚀)

---

*Ship or Slip - Where every PR is a prediction market* 🎮