import { Octokit } from "@octokit/rest";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const PROGRAM_ID = new PublicKey("HSkqo48KXh7xF7RLPCqQEtExBH6AqdU4rz6s2odFgYAi");
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const POLL_INTERVAL = 30000;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function loadKeypair(): Keypair {
  const keypairPath = process.env.KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function runOracle() {
  console.log("🚀 Ship or Slip Oracle Starting...");
  console.log("   Program:", PROGRAM_ID.toBase58());
  console.log("   RPC:", RPC_URL);

  const keypair = loadKeypair();
  console.log("   Wallet:", keypair.publicKey.toBase58());

  const poll = async () => {
    console.log("\n📡 [" + new Date().toISOString() + "] Checking markets...");
    console.log("   Oracle ready - waiting for markets");
  };

  await poll();
  setInterval(poll, POLL_INTERVAL);
}

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  process.exit(0);
});

runOracle().catch(console.error);
