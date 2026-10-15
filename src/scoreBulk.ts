import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import type { Lead, ScoreResult } from "./types.js";
import { sampleICP } from "./sampleLeads.js";
import { scoreLeadsBatched } from "./jevClient.js";

const inputPath = new URL("../data/leads-generated.json", import.meta.url);
const leads: Lead[] = JSON.parse(readFileSync(inputPath, "utf-8"));

console.log(`Scoring ${leads.length} leads against ICP (concurrency=20)...`);
const start = Date.now();
let lastReported = 0;

const results: ScoreResult[] = await scoreLeadsBatched(leads, sampleICP, 20, (done, total) => {
  if (done - lastReported >= 50 || done === total) {
    lastReported = done;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    process.stdout.write(`  ${done}/${total} scored (${elapsed}s elapsed)\n`);
  }
});

const totalMs = Date.now() - start;
const strong = results.filter((r) => r.category === "strong-match").length;
const possible = results.filter((r) => r.category === "possible-match").length;
const poor = results.filter((r) => r.category === "poor-match").length;
const fromApi = results.filter((r) => r.source === "jev-api").length;
const fromMock = results.filter((r) => r.source === "mock").length;
const avgLatency = Math.round(results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length);

writeFileSync(new URL("../data/scores-generated.json", import.meta.url), JSON.stringify(results, null, 2));

console.log("\n=== Summary ===");
console.log(`Total leads scored: ${results.length}`);
console.log(`Total time: ${(totalMs / 1000).toFixed(1)}s  (${(results.length / (totalMs / 1000)).toFixed(1)} leads/sec)`);
console.log(`Avg per-lead latency: ${avgLatency}ms`);
console.log(`Source: ${fromApi} via real Jev API, ${fromMock} via mock fallback`);
console.log(`strong-match: ${strong}  possible-match: ${possible}  poor-match: ${poor}`);
console.log(`Full results written to data/scores-generated.json`);
