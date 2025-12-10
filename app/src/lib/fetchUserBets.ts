import { Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import bs58 from "bs58";

export const PROGRAM_ID = new PublicKey("HSkqo48KXh7xF7RLPCqQEtExBH6AqdU4rz6s2odFgYAi");

// Bet account discriminator from IDL
const BET_DISCRIMINATOR = Buffer.from([147, 23, 35, 59, 15, 75, 155, 32]);

export interface BetData {
  pubkey: string;
  bettor: string;
  market: string;
  side: "ship" | "slip";
  amount: number;
  claimed: boolean;
}

function decodeBet(pubkey: PublicKey, data: Buffer): BetData | null {
  try {
    let offset = 8; // Skip discriminator
    
    const bettor = new PublicKey(data.subarray(offset, offset + 32)).toBase58();
    offset += 32;
    
    const market = new PublicKey(data.subarray(offset, offset + 32)).toBase58();
    offset += 32;
    
    const sideByte = data.readUInt8(offset);
    const side = sideByte === 0 ? "ship" : "slip";
    offset += 1;
    
    const amount = Number(data.readBigUInt64LE(offset)) / 1_000_000_000;
    offset += 8;
    
    const claimed = data.readUInt8(offset) === 1;
    
    return { pubkey: pubkey.toBase58(), bettor, market, side, amount, claimed };
  } catch (e) {
    console.error("Failed to decode bet:", e);
    return null;
  }
}

export async function fetchUserBets(connection: Connection, userPubkey: PublicKey): Promise<BetData[]> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { memcmp: { offset: 0, bytes: bs58.encode(BET_DISCRIMINATOR) } },
        { memcmp: { offset: 8, bytes: userPubkey.toBase58() } }
      ],
    });
    
    const bets: BetData[] = [];
    for (const { pubkey, account } of accounts) {
      const bet = decodeBet(pubkey, Buffer.from(account.data));
      if (bet) bets.push(bet);
    }
    
    return bets;
  } catch (e) {
    console.error("Failed to fetch user bets:", e);
    return [];
  }
}
