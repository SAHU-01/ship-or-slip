use anchor_lang::prelude::*;

declare_id!("HSkqo48KXh7xF7RLPCqQEtExBH6AqdU4rz6s2odFgYAi");

#[program]
pub mod ship_or_slip {
    use super::*;

    /// Create a new prediction market for a GitHub PR
    pub fn create_market(
        ctx: Context<CreateMarket>,
        repo: String,
        pr_number: u64,
        deadline: i64,
    ) -> Result<()> {
        require!(repo.len() <= 100, ShipError::RepoTooLong);
        
        let clock = Clock::get()?;
        require!(deadline > clock.unix_timestamp, ShipError::DeadlinePassed);

        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.repo = repo;
        market.pr_number = pr_number;
        market.deadline = deadline;
        market.ship_pool = 0;
        market.slip_pool = 0;
        market.total_bettors = 0;
        market.status = MarketStatus::Open;
        market.outcome = MarketOutcome::Pending;
        market.bump = ctx.bumps.market;

        msg!("🚀 Market created: PR #{}", pr_number);
        Ok(())
    }

    /// Place a bet on a market
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        side: BetSide,
        amount: u64,
    ) -> Result<()> {
        require!(amount >= 10_000_000, ShipError::BetTooSmall); // Min 0.01 SOL

        let market = &ctx.accounts.market;
        require!(market.status == MarketStatus::Open, ShipError::MarketNotOpen);
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < market.deadline, ShipError::DeadlinePassed);

        // Transfer SOL to vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.bettor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        // Update market pools
        let market = &mut ctx.accounts.market;
        match side {
            BetSide::Ship => market.ship_pool = market.ship_pool.checked_add(amount).unwrap(),
            BetSide::Slip => market.slip_pool = market.slip_pool.checked_add(amount).unwrap(),
        }
        market.total_bettors += 1;

        // Create bet record
        let bet = &mut ctx.accounts.bet;
        bet.bettor = ctx.accounts.bettor.key();
        bet.market = ctx.accounts.market.key();
        bet.side = side;
        bet.amount = amount;
        bet.claimed = false;
        bet.bump = ctx.bumps.bet;

        msg!("🎲 Bet placed: {} lamports", amount);
        Ok(())
    }

    /// Resolve market (oracle only)
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome: MarketOutcome,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, ShipError::MarketNotOpen);
        require!(outcome != MarketOutcome::Pending, ShipError::InvalidOutcome);

        market.status = MarketStatus::Resolved;
        market.outcome = outcome.clone();

        msg!("✅ Market resolved: {:?}", outcome);
        Ok(())
    }

    /// Claim winnings
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let bet = &ctx.accounts.bet;
        let market = &ctx.accounts.market;

        require!(!bet.claimed, ShipError::AlreadyClaimed);
        require!(market.status == MarketStatus::Resolved, ShipError::MarketNotResolved);

        // Check if won
        let won = match (&bet.side, &market.outcome) {
            (BetSide::Ship, MarketOutcome::Ship) => true,
            (BetSide::Slip, MarketOutcome::Slip) => true,
            _ => false,
        };
        require!(won, ShipError::BetLost);

        // Calculate payout
        let total_pool = market.ship_pool.checked_add(market.slip_pool).unwrap();
        let winning_pool = match market.outcome {
            MarketOutcome::Ship => market.ship_pool,
            MarketOutcome::Slip => market.slip_pool,
            _ => return Err(ShipError::InvalidOutcome.into()),
        };

        let payout = (bet.amount as u128)
            .checked_mul(total_pool as u128).unwrap()
            .checked_div(winning_pool as u128).unwrap() as u64;

        // Transfer from vault
        let market_key = market.key();
        let seeds = &[
            b"vault",
            market_key.as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.bettor.to_account_info(),
            },
            signer,
        );
        anchor_lang::system_program::transfer(cpi_context, payout)?;

        // Mark claimed
        let bet = &mut ctx.accounts.bet;
        bet.claimed = true;

        msg!("💰 Claimed {} lamports!", payout);
        Ok(())
    }
}

// === ACCOUNTS ===

#[derive(Accounts)]
#[instruction(repo: String, pr_number: u64)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", repo.as_bytes(), &pr_number.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    /// CHECK: PDA vault for holding bets
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    /// CHECK: PDA vault
    pub vault: SystemAccount<'info>,

    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", market.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub bettor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        constraint = market.status == MarketStatus::Resolved @ ShipError::MarketNotResolved
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    /// CHECK: PDA vault
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        has_one = bettor,
        has_one = market,
        constraint = !bet.claimed @ ShipError::AlreadyClaimed
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub bettor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// === STATE ===

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    #[max_len(100)]
    pub repo: String,
    pub pr_number: u64,
    pub deadline: i64,
    pub ship_pool: u64,
    pub slip_pool: u64,
    pub total_bettors: u32,
    pub status: MarketStatus,
    pub outcome: MarketOutcome,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub bettor: Pubkey,
    pub market: Pubkey,
    pub side: BetSide,
    pub amount: u64,
    pub claimed: bool,
    pub bump: u8,
}

// === ENUMS ===

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MarketStatus {
    Open,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum MarketOutcome {
    Pending,
    Ship,
    Slip,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum BetSide {
    Ship,
    Slip,
}

// === ERRORS ===

#[error_code]
pub enum ShipError {
    #[msg("Repo name too long")]
    RepoTooLong,
    #[msg("Deadline has passed")]
    DeadlinePassed,
    #[msg("Market is not open")]
    MarketNotOpen,
    #[msg("Bet too small (min 0.01 SOL)")]
    BetTooSmall,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Market not resolved")]
    MarketNotResolved,
    #[msg("Bet lost")]
    BetLost,
    #[msg("Invalid outcome")]
    InvalidOutcome,
}
