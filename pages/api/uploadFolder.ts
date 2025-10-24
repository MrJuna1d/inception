import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

// Pinata API response type
interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export const config = {
  api: {
    bodyParser: true,
    maxDuration: 300 // 5 minutes timeout
  }
};

// ---- Types for manifest
interface GameManifest {
  name: string;
  metadata: {
    uploadDate: string;
    fileCount: number;
    totalSize: number;
    engine: string;
  };
  ipfs: {
    cid: string;
    playableUrl: string;
  };
}

const PINATA_GATEWAY = "lavender-fast-tarantula-824.mypinata.cloud";

if (!process.env.PINATA_JWT) {
  console.warn("⚠️ PINATA_JWT not set; uploads will fail.");
}

import multiparty from 'multiparty';
import { Readable } from 'stream';

// Parse form data into files and fields
function parseFormData(req: NextApiRequest): Promise<{
  files: multiparty.File[];
  fields: { [key: string]: string[] };
}> {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({
        files: Object.values(files).flat(),
        fields
      });
    });
  });
}

// Convert multiparty files to the format expected by Pinata
async function processUploadedFiles(files: multiparty.File[]): Promise<{ path: string; content: Buffer }[]> {
  return Promise.all(
    files.map(async (file) => ({
      path: file.originalFilename || file.path,
      content: await fs.promises.readFile(file.path)
    }))
  );
}

// ---- Recursively read a folder and return relative paths + buffers
async function readDirRecursive(rootAbs: string): Promise<{ path: string; content: Buffer }[]> {
  const output: { path: string; content: Buffer }[] = [];
  
  async function walk(dirAbs: string, baseAbs: string) {
    const entries = await fs.promises.readdir(dirAbs, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirAbs, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath, baseAbs);
      } else if (entry.isFile()) {
        const relativePath = path.relative(baseAbs, fullPath).replace(/\\/g, "/");
        const content = await fs.promises.readFile(fullPath);
        output.push({ path: relativePath, content });
      }
    }
  }

  await walk(rootAbs, rootAbs);
  return output;
}

// ---- Generate manifest for the uploaded folder
function generateManifest(
  folderName: string,
  files: { path: string; content: Buffer }[],
  cid: string,
  playableUrl: string
): GameManifest {
  const totalSize = files.reduce((acc, file) => acc + file.content.length, 0);
  
  return {
    name: folderName,
    metadata: {
      uploadDate: new Date().toISOString(),
      fileCount: files.length,
      totalSize: totalSize,
      engine: "Godot", // Assuming it's a Godot game based on the file structure
    },
    ipfs: {
      cid,
      playableUrl,
    }
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS (loosen for local dev)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Expect JSON body: { folderPath: "<absolute-or-relative-path>" }
    const folderPath = (req.body?.folderPath ?? "").toString();
    if (!folderPath) return res.status(400).json({ error: "Missing folderPath" });

    // Resolve and validate path
    const abs = path.resolve(folderPath); // allows absolute paths like /Users/...
    if (!fs.existsSync(abs)) return res.status(400).json({ error: `Folder not found: ${abs}` });
    const stat = await fs.promises.stat(abs);
    if (!stat.isDirectory()) return res.status(400).json({ error: `Not a directory: ${abs}` });

    // Read files
    const files = await readDirRecursive(abs);
    if (!files.length) return res.status(400).json({ error: "Directory is empty" });

    // Create form data for Pinata upload
    const formData = new FormData();
    files.forEach(f => {
      // Convert Buffer to Uint8Array which is safely accepted by Blob
      const uint8Array = new Uint8Array(f.content);
      const blob = new Blob([uint8Array], { type: "application/octet-stream" });
      formData.append('file', blob, f.path);
    });

    // Upload directly to Pinata API
    const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Pinata upload failed: ${await uploadResponse.text()}`);
    }

    const result = await uploadResponse.json();
    const cid = result.IpfsHash;

    // Generate playable URL
    const playableUrl = cid ? `https://ipfs.io/ipfs/${cid}/index.html` : "";

    // Generate manifest
    const folderName = path.basename(abs);
    const manifest = generateManifest(folderName, files, cid || "", playableUrl);
    
    // Store the metadata on Solana if wallet is connected
    if (req.body.wallet) {
      try {
        const { storeGameMetadata } = await import('../../script/storeGameMetadata');


        // flatten the structure
      const flatManifest = {
        name: manifest.name,
        uploadDate: manifest.metadata.uploadDate,
        fileCount: manifest.metadata.fileCount,
        totalSize: manifest.metadata.totalSize,
        engine: manifest.metadata.engine,
        ipfs: manifest.ipfs,
      };

        await storeGameMetadata(req.body.wallet, flatManifest);
      } catch (err) {
        console.error("Failed to store metadata on Solana:", err);
        // Continue anyway as IPFS upload succeeded
      }
    }

    return res.status(200).json({
      success: true,
      manifest: manifest,
      note: "Ensure your Godot HTML5 export folder contains index.html at the root.",
    });
  } catch (err: any) {
    console.error("uploadFolder error:", err);
    return res.status(500).json({ error: "Folder upload failed", details: err?.message ?? String(err) });
  }
}
