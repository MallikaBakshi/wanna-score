import { setDefaultResultOrder } from "node:dns";
import type { Lead, ICP, ScoreResult } from "./types.js";

// Works around an undici (Node's fetch) connect-timeout flakiness seen
// against api.typesafe.ai's Cloudflare edge — curl was unaffected, only
// Node's fetch; forcing IPv4-first DNS resolution fixes it.
setDefaultResultOrder("ipv4first");

const JEV_API_KEY = process.env.JEV_API_KEY;
const JEV_API_URL = process.env.JEV_API_URL ?? "https://api.typesafe.ai/v1/systemone";
const MAX_RETRIES = 2;

const CATEGORY_BASE_SCORE: Record<string, number> = {
  "strong-match": 85,
  "possible-match": 55,
  "poor-match": 20,
};

/**
 * Scores one lead against an ICP via the real Jev API when JEV_API_KEY is set.
 * Falls back to a rule-based mock so the UI stays usable without credentials.
 * Verified request/response shape: POST https://api.typesafe.ai/v1/systemone
 */
export async function scoreLead(lead: Lead, icp: ICP): Promise<ScoreResult> {
  const start = Date.now();

  if (!JEV_API_KEY) {
    return mockScore(lead, icp, Date.now() - start);
  }

  try {
    const data = await fetchWithRetry(lead, icp);
    const answer = data.answers?.match_category;
    if (!answer?.choice) {
      throw new Error(`Unexpected Jev response shape: ${JSON.stringify(data)}`);
    }

    const category = answer.choice as ScoreResult["category"];
    const confidence = answer.confidence ?? 0;
    const score = Math.min(100, Math.round(CATEGORY_BASE_SCORE[category] + confidence * 10));

    return {
      leadId: lead.id,
      score,
      matchReasons: deriveMatchReasons(lead, icp),
      category,
      source: "jev-api",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    console.error(`[jevClient] Falling back to mock — real API call failed: ${(err as Error).message}`);
    return mockScore(lead, icp, Date.now() - start);
  }
}

async function fetchWithRetry(lead: Lead, icp: ICP): Promise<any> {
  let lastErr: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(JEV_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${JEV_API_KEY}`,
        },
        body: JSON.stringify({
          model: "jev-latest",
          state: {
            lead_name: lead.name,
            lead_title: lead.title,
            company: lead.company,
            company_size: lead.companySize,
            industry: lead.industry,
            annual_revenue: lead.annualRevenue,
            is_decision_maker: String(lead.isDecisionMaker),
            has_active_ai_project: String(lead.hasActiveAIProject),
            icp_target_sizes: icp.targetCompanySizes.join(", "),
            icp_target_industries: icp.targetIndustries.join(", "),
            icp_target_revenue: icp.targetRevenueRanges.join(", "),
            icp_requires_decision_maker: String(icp.requireDecisionMaker),
          },
          questions: {
            match_category: {
              type: "choice",
              instructions: "Given this lead's profile and the target ICP, how good a match is this lead?",
              criteria: {
                "strong-match": "Company size, industry, and revenue fit the ICP, and the role satisfies the decision-maker requirement.",
                "possible-match": "Partially fits the ICP (e.g. right industry but borderline size/revenue, or role unclear).",
                "poor-match": "Does not fit the ICP on size, industry, revenue, or decision-maker requirement.",
              },
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Jev API error: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err as Error;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

export async function scoreLeads(leads: Lead[], icp: ICP): Promise<ScoreResult[]> {
  return Promise.all(leads.map((lead) => scoreLead(lead, icp)));
}

/**
 * Scores many leads with bounded concurrency so we don't fire thousands of
 * parallel requests at once (rate limits, shared hackathon key).
 */
export async function scoreLeadsBatched(
  leads: Lead[],
  icp: ICP,
  concurrency = 20,
  onProgress?: (done: number, total: number) => void
): Promise<ScoreResult[]> {
  const results: ScoreResult[] = new Array(leads.length);
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < leads.length) {
      const i = next++;
      results[i] = await scoreLead(leads[i], icp);
      done++;
      onProgress?.(done, leads.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, leads.length) }, worker));
  return results;
}

function deriveMatchReasons(lead: Lead, icp: ICP): string[] {
  const reasons: string[] = [];
  if (icp.targetCompanySizes.includes(lead.companySize)) reasons.push("Company size match");
  if (icp.targetIndustries.includes(lead.industry)) reasons.push("Industry match");
  if (icp.targetRevenueRanges.includes(lead.annualRevenue)) reasons.push("Revenue match");
  if (!icp.requireDecisionMaker || lead.isDecisionMaker) reasons.push("Decision-maker role");
  if (lead.hasActiveAIProject) reasons.push("Active AI project");
  return reasons;
}

function mockScore(lead: Lead, icp: ICP, elapsedMs: number): ScoreResult {
  const reasons = deriveMatchReasons(lead, icp);
  let category: ScoreResult["category"] = "poor-match";
  if (reasons.length >= 3) category = "strong-match";
  else if (reasons.length >= 1) category = "possible-match";

  return {
    leadId: lead.id,
    score: Math.min(100, CATEGORY_BASE_SCORE[category] + reasons.length * 2),
    matchReasons: reasons,
    category,
    source: "mock",
    latencyMs: elapsedMs,
  };
}
