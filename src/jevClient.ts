import type { Lead, ICP, ScoreResult } from "./types.js";

const JEV_API_KEY = process.env.JEV_API_KEY;
const JEV_API_URL = process.env.JEV_API_URL ?? "https://api.typesafe.ai/v1/systemone";

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
          is_decision_maker: String(lead.isDecisionMaker),
          has_active_ai_project: String(lead.hasActiveAIProject),
          icp_target_sizes: icp.targetCompanySizes.join(", "),
          icp_target_industries: icp.targetIndustries.join(", "),
          icp_requires_decision_maker: String(icp.requireDecisionMaker),
        },
        questions: {
          match_category: {
            type: "choice",
            instructions: "Given this lead's profile and the target ICP, how good a match is this lead?",
            criteria: {
              "strong-match": "Company size and industry fit the ICP, and the role satisfies the decision-maker requirement.",
              "possible-match": "Partially fits the ICP (e.g. right industry but borderline size, or role unclear).",
              "poor-match": "Does not fit the ICP on size, industry, or decision-maker requirement.",
            },
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Jev API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
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

export async function scoreLeads(leads: Lead[], icp: ICP): Promise<ScoreResult[]> {
  return Promise.all(leads.map((lead) => scoreLead(lead, icp)));
}

function deriveMatchReasons(lead: Lead, icp: ICP): string[] {
  const reasons: string[] = [];
  if (icp.targetCompanySizes.includes(lead.companySize)) reasons.push("Company size match");
  if (icp.targetIndustries.includes(lead.industry)) reasons.push("Industry match");
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
