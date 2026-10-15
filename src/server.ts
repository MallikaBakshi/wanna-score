import "dotenv/config";
import express from "express";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ScoreLeadsRequest, Lead } from "./types.js";
import { scoreLeadsBatched } from "./jevClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

// All scoring goes through bounded concurrency (20 at a time) regardless of
// batch size — safe for 3 leads or 1000, avoids slamming the API/rate limits.
app.post("/api/score-leads", async (req, res) => {
  const { leads, icp } = req.body as ScoreLeadsRequest;

  if (!Array.isArray(leads) || !icp) {
    return res.status(400).json({ error: "leads[] and icp are required" });
  }

  try {
    const results = await scoreLeadsBatched(leads, icp, 20);
    res.json(results);
  } catch (err) {
    console.error("[server] Scoring failed:", err);
    res.status(500).json({ error: "Scoring failed", message: (err as Error).message });
  }
});

// Serves the pre-generated 1000 synthetic leads (run `npx tsx src/generateLeads.ts`
// to regenerate) so the UI can load a large batch without embedding it inline.
app.get("/api/leads/generated", (_req, res) => {
  const filePath = path.join(__dirname, "..", "data", "leads-generated.json");
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: "No generated leads found. Run: npx tsx src/generateLeads.ts" });
  }
  const leads: Lead[] = JSON.parse(readFileSync(filePath, "utf-8"));
  res.json(leads);
});

app.listen(PORT, () => {
  console.log(`Jev lead scorer running at http://localhost:${PORT}`);
});
