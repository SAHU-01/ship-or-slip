use anchor_lang::prelude::*;

declare_id!("7vTkYDA8GcM4JCtrgnDyosw4Jk82qrzKwBhn2uRfQNVS");

#[program]
pub mod ship_or_slip {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
