import { PublicKey, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Buffer } from "buffer";

export const PROGRAM_ID = new PublicKey("HSkqo48KXh7xF7RLPCqQEtExBH6AqdU4rz6s2odFgYAi");

// Discriminators from IDL
const DISCRIMINATORS = {
  create_market: Buffer.from([103, 226, 97, 235, 200, 188, 251, 254]),
  place_bet: Buffer.from([222, 62, 67, 220, 63, 166, 126, 33]),
};

export function getMarketPDA(repo: string, prNumber: number): [PublicKey, number] {
  const repoBytes = Buffer.from(repo.slice(0, 100));
  const prBytes = Buffer.alloc(8);  // u64 = 8 bytes
  prBytes.writeBigUInt64LE(BigInt(prNumber), 0);
  return PublicKey.findProgramAddressSync([Buffer.from("market"), repoBytes, prBytes], PROGRAM_ID);
}

export function getVaultPDA(marketPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("vault"), marketPubkey.toBuffer()], PROGRAM_ID);
}

export function getBetPDA(marketPubkey: PublicKey, bettorPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("bet"), marketPubkey.toBuffer(), bettorPubkey.toBuffer()], PROGRAM_ID);
}

function serializeString(str: string): Buffer {
  const strBytes = Buffer.from(str, "utf8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBytes.length, 0);
  return Buffer.concat([lenBuf, strBytes]);
}

function serializeU64(num: number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(num), 0);
  return buf;
}

function serializeI64(num: number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(num), 0);
  return buf;
}

export function createMarketInstruction(
  repo: string, prNumber: number, deadline: number,
  marketPDA: PublicKey, vaultPDA: PublicKey, creator: PublicKey
): TransactionInstruction {
  const data = Buffer.concat([
    DISCRIMINATORS.create_market,
    serializeString(repo),
    serializeU64(prNumber),  // u64, not u32!
    serializeI64(deadline)
  ]);
  return new TransactionInstruction({
    keys: [
      { pubkey: marketPDA, isSigner: false, isWritable: true },
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

export function placeBetInstruction(
  side: "ship" | "slip", amountSol: number,
  marketPDA: PublicKey, vaultPDA: PublicKey, betPDA: PublicKey, bettor: PublicKey
): TransactionInstruction {
  const data = Buffer.concat([
    DISCRIMINATORS.place_bet,
    Buffer.from([side === "ship" ? 0 : 1]),
    serializeU64(Math.floor(amountSol * LAMPORTS_PER_SOL))
  ]);
  return new TransactionInstruction({
    keys: [
      { pubkey: marketPDA, isSigner: false, isWritable: true },
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: betPDA, isSigner: false, isWritable: true },
      { pubkey: bettor, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}
