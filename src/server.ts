import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ScoreLeadsRequest } from "./types.js";
import { scoreLeads } from "./jevClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.post("/api/score-leads", async (req, res) => {
  const { leads, icp } = req.body as ScoreLeadsRequest;

  if (!Array.isArray(leads) || !icp) {
    return res.status(400).json({ error: "leads[] and icp are required" });
  }

  try {
    const results = await scoreLeads(leads, icp);
    res.json(results);
  } catch (err) {
    console.error("[server] Scoring failed:", err);
    res.status(500).json({ error: "Scoring failed", message: (err as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Jev lead scorer running at http://localhost:${PORT}`);
});
