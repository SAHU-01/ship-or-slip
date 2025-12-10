import { Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import bs58 from "bs58";

export const PROGRAM_ID = new PublicKey("HSkqo48KXh7xF7RLPCqQEtExBH6AqdU4rz6s2odFgYAi");
const MARKET_DISCRIMINATOR = Buffer.from([219, 190, 213, 55, 0, 227, 198, 154]);

export interface MarketData {
  pubkey: string;
  authority: string;
  repo: string;
  prNumber: number;
  deadline: number;
  shipPool: number;
  slipPool: number;
  totalBettors: number;
  status: "open" | "resolved";
  outcome: "pending" | "ship" | "slip";
}

function decodeMarket(pubkey: PublicKey, data: Buffer): MarketData | null {
  try {
    let offset = 8;
    const authority = new PublicKey(data.subarray(offset, offset + 32)).toBase58();
    offset += 32;
    const repoLen = data.readUInt32LE(offset);
    offset += 4;
    const repo = data.subarray(offset, offset + repoLen).toString("utf8");
    offset += repoLen;
    const prNumber = Number(data.readBigUInt64LE(offset));
    offset += 8;
    const deadline = Number(data.readBigInt64LE(offset));
    offset += 8;
    const shipPool = Number(data.readBigUInt64LE(offset)) / 1_000_000_000;
    offset += 8;
    const slipPool = Number(data.readBigUInt64LE(offset)) / 1_000_000_000;
    offset += 8;
    const totalBettors = data.readUInt32LE(offset);
    offset += 4;
    const statusByte = data.readUInt8(offset);
    const status = statusByte === 0 ? "open" : "resolved";
    offset += 1;
    const outcomeByte = data.readUInt8(offset);
    const outcome = outcomeByte === 0 ? "pending" : outcomeByte === 1 ? "ship" : "slip";
    return { pubkey: pubkey.toBase58(), authority, repo, prNumber, deadline, shipPool, slipPool, totalBettors, status, outcome };
  } catch (e) {
    return null;
  }
}

export async function fetchAllMarkets(connection: Connection): Promise<MarketData[]> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ memcmp: { offset: 0, bytes: bs58.encode(MARKET_DISCRIMINATOR) } }],
    });
    const markets: MarketData[] = [];
    for (const { pubkey, account } of accounts) {
      const market = decodeMarket(pubkey, Buffer.from(account.data));
      if (market) markets.push(market);
    }
    return markets;
  } catch (e) {
    return [];
  }
}
