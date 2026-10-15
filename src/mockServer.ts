// Mock server implementing the SAME contract as the real server.
// Person B (frontend) runs this to build the UI without waiting on
// Person A's Jev integration. Swap in the real server when ready —
// the request/response shape is identical.
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ScoreLeadsRequest, ScoreResult } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.post("/api/score-leads", (req, res) => {
  const { leads } = req.body as ScoreLeadsRequest;
  const results: ScoreResult[] = leads.map((lead, i) => ({
    leadId: lead.id,
    score: [94, 87, 22, 78][i % 4],
    matchReasons: ["Company size match", "Decision-maker role", "Active AI project"].slice(0, (i % 3) + 1),
    category: i % 3 === 2 ? "poor-match" : "strong-match",
    source: "mock",
    latencyMs: 5,
  }));
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`[MOCK] Lead scorer running at http://localhost:${PORT}`);
});
