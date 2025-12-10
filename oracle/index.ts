import { Octokit } from "@octokit/rest";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import bs58 from "bs58";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const PROGRAM_ID = new PublicKey("HSkqo48KXh7xF7RLPCqQEtExBH6AqdU4rz6s2odFgYAi");
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const POLL_INTERVAL = 30000;

const MARKET_DISCRIMINATOR = Buffer.from([219, 190, 213, 55, 0, 227, 198, 154]);
const RESOLVE_DISCRIMINATOR = Buffer.from([155, 23, 80, 173, 46, 74, 23, 239]);

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

interface Market {
  pubkey: PublicKey;
  repo: string;
  prNumber: number;
  deadline: number;
  status: "open" | "resolved";
}

function loadKeypair(): Keypair {
  const keypairPath = process.env.KEYPAIR_PATH || process.env.HOME + "/.config/solana/id.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

function decodeMarket(pubkey: PublicKey, data: Buffer): Market | null {
  try {
    let offset = 8;
    offset += 32;
    const repoLen = data.readUInt32LE(offset);
    offset += 4;
    const repo = data.subarray(offset, offset + repoLen).toString("utf8");
    offset += repoLen;
    const prNumber = Number(data.readBigUInt64LE(offset));
    offset += 8;
    const deadline = Number(data.readBigInt64LE(offset));
    offset += 8 + 16 + 4;
    const statusByte = data.readUInt8(offset);
    const status = statusByte === 0 ? "open" : "resolved";
    return { pubkey, repo, prNumber, deadline, status };
  } catch {
    return null;
  }
}

async function fetchAllMarkets(connection: Connection): Promise<Market[]> {
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ memcmp: { offset: 0, bytes: bs58.encode(MARKET_DISCRIMINATOR) } }],
  });
  const markets: Market[] = [];
  for (const { pubkey, account } of accounts) {
    const market = decodeMarket(pubkey, Buffer.from(account.data));
    if (market) markets.push(market);
  }
  return markets;
}

async function checkPRStatus(repo: string, prNumber: number): Promise<"merged" | "closed" | "open"> {
  try {
    const [owner, repoName] = repo.split("/");
    const { data: pr } = await octokit.pulls.get({ owner, repo: repoName, pull_number: prNumber });
    if (pr.merged) return "merged";
    if (pr.state === "closed") return "closed";
    return "open";
  } catch {
    return "open";
  }
}

async function resolveMarket(connection: Connection, keypair: Keypair, market: Market, outcome: "ship" | "slip"): Promise<string> {
  const outcomeValue = outcome === "ship" ? 0 : 1;
  const data = Buffer.concat([RESOLVE_DISCRIMINATOR, Buffer.from([outcomeValue])]);
  const ix = new TransactionInstruction({
    keys: [
      { pubkey: market.pubkey, isSigner: false, isWritable: true },
      { pubkey: keypair.publicKey, isSigner: true, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
  const tx = new Transaction().add(ix);
  tx.feePayer = keypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(keypair);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

async function runOracle() {
  console.log("Ship or Slip Oracle Starting...");
  console.log("Program:", PROGRAM_ID.toBase58());
  const keypair = loadKeypair();
  console.log("Oracle:", keypair.publicKey.toBase58());
  const connection = new Connection(RPC_URL, "confirmed");
  const balance = await connection.getBalance(keypair.publicKey);
  console.log("Balance:", balance / 1e9, "SOL");

  const poll = async () => {
    const timestamp = new Date().toISOString();
    console.log("\n[" + timestamp + "] Polling...");
    try {
      const markets = await fetchAllMarkets(connection);
      const openMarkets = markets.filter(m => m.status === "open");
      console.log("Found", openMarkets.length, "open markets");
      
      for (const market of openMarkets) {
        console.log("\nMarket:", market.repo, "PR#" + market.prNumber);
        const now = Math.floor(Date.now() / 1000);
        if (now < market.deadline) {
          console.log("  Deadline not reached");
          continue;
        }
        const prStatus = await checkPRStatus(market.repo, market.prNumber);
        console.log("  GitHub:", prStatus);
        if (prStatus === "open") continue;
        
        const outcome = prStatus === "merged" ? "ship" : "slip";
        console.log("  Resolving as", outcome);
        try {
          const sig = await resolveMarket(connection, keypair, market, outcome);
          console.log("  Done:", sig.slice(0, 20));
        } catch (e: any) {
          console.error("  Error:", e.message);
        }
      }
    } catch (e: any) {
      console.error("Poll error:", e.message);
    }
  };

  await poll();
  setInterval(poll, POLL_INTERVAL);
}

runOracle().catch(console.error);
