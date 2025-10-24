import { Program, AnchorProvider, Idl } from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import  rawIdl  from "../idl/backend.json";

export const PROGRAM_ID = "GvdTzJj5RBtNerqwr2XZXu2jx77CjJSxVUtg7Mg3fqGe";
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

export async function storeGameMetadata(
  provider: AnchorProvider,
  metadata: {
    name: string;
    uploadDate: string;
    fileCount: number;
    totalSize: number;
    engine: string;
    ipfs: {
      cid: string;
      playableUrl: string;
    };
  }
) {
  const program = new Program(rawIdl as unknown as Idl, PROGRAM_ID, provider);
  
  // Get the PDA for this user's game metadata
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("game_metadata"),
      provider.wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  try {
    // Store the metadata on-chain
    const tx = await program.methods
      .storeGameMetadata(
        metadata.name,
        metadata.uploadDate,
        metadata.fileCount,
        metadata.totalSize,
        metadata.engine,
        metadata.ipfs.cid,
        metadata.ipfs.playableUrl
      )
      .accounts({
        metadataAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error storing game metadata:", error);
    throw error;
  }
}
