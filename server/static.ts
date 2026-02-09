import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Hashed assets (e.g., index-abc123.js) — cache forever
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));

  // Other static files (index.html, manifest, sw.js) — no cache
  app.use(express.static(distPath, {
    maxAge: 0,
  }));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
