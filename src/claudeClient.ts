import type { Lead, ScoreResult } from "./types.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export type OutreachDraft = {
  leadId: string;
  subject: string;
  body: string;
  source: "claude-api" | "mock";
};

// Real TrueHorizon case studies (truehorizon.ai/customers), mapped to our
// ICP industries, so outreach can cite a genuinely relevant proof point
// instead of a generic claim. Industries with no direct case study fall
// back to the aggregate stat (40+ engagements, 127% ROI, 98% retention).
const CASE_STUDY_BY_INDUSTRY: Record<string, string> = {
  "Tax & Compliance": "our work with Avalara, a global leader in tax compliance software",
  "Media & Localization": "our work with Iyuno, a global leader in localization and dubbing",
  "Recruitment & Staffing": "our work with DKF Recruitment on automating their labour-solutions workflow",
  "Procurement & Supply Chain": "our work with Pierpont Holdings on procurement intelligence automation",
  "Entertainment & Hospitality": "our work with Topgolf automating high-volume experiential operations",
  "Financial Services": "our enterprise AI deployments at JP Morgan",
  "Enterprise SaaS": "our enterprise AI deployments at Salesforce",
};
const FALLBACK_PROOF = "40+ enterprise AI deployments with a 127% average ROI and 98% client retention";

function proofPointFor(industry: string): string {
  return CASE_STUDY_BY_INDUSTRY[industry] ?? FALLBACK_PROOF;
}

/**
 * Drafts a short, personalized outreach email for one qualified lead,
 * citing Jev's actual match reasons AND a relevant TrueHorizon case study.
 * Falls back to a template draft when ANTHROPIC_API_KEY isn't set, so the
 * feature stays demoable without it.
 */
export async function draftOutreach(lead: Lead, score: ScoreResult): Promise<OutreachDraft> {
  if (!ANTHROPIC_API_KEY) {
    return mockDraft(lead, score);
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Write a short, highly specific cold outreach email (plain text, no markdown) from TrueHorizon (an enterprise AI automation consultancy — truehorizon.ai) to this qualified lead:

Name: ${lead.name}
Title: ${lead.title}
Company: ${lead.company}
Industry: ${lead.industry}
Company size: ${lead.companySize}
Annual revenue: ${lead.annualRevenue}
ICP match reasons (from our Jev-powered scoring, score ${score.score}/100): ${score.matchReasons.join(", ")}
Relevant proof point to cite: ${proofPointFor(lead.industry)}

Requirements:
- Open with something specific to their role/company, not a generic greeting
- Naturally weave in 1-2 of the match reasons as why we're reaching out now
- Cite the proof point as a concrete, relevant credential (not a generic "we've helped many companies")
- One specific, low-friction ask (e.g. a 15-min call next week)
- 4-5 sentences max, confident but not pushy, no corporate jargon
- Sign off as "— TrueHorizon"

Reply in this exact format:
SUBJECT: <subject line, specific not generic>
BODY: <email body>`,
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";
    const subjectMatch = text.match(/SUBJECT:\s*(.+)/);
    const bodyMatch = text.match(/BODY:\s*([\s\S]+)/);

    if (!subjectMatch || !bodyMatch) {
      throw new Error(`Unexpected Claude response shape: ${text}`);
    }

    return {
      leadId: lead.id,
      subject: subjectMatch[1].trim(),
      body: bodyMatch[1].trim(),
      source: "claude-api",
    };
  } catch (err) {
    console.error(`[claudeClient] Falling back to mock — real API call failed: ${(err as Error).message}`);
    return mockDraft(lead, score);
  }
}

export async function draftOutreachBatch(
  leads: Lead[],
  scores: ScoreResult[]
): Promise<OutreachDraft[]> {
  const byId = Object.fromEntries(scores.map((s) => [s.leadId, s]));
  return Promise.all(
    leads.map((lead) => draftOutreach(lead, byId[lead.id]))
  );
}

function mockDraft(lead: Lead, score: ScoreResult): OutreachDraft {
  const firstName = lead.name.split(" ").pop() ?? lead.name;
  const topReason = score.matchReasons[0]?.toLowerCase() ?? "your team's profile";
  const proof = proofPointFor(lead.industry);

  return {
    leadId: lead.id,
    subject: `[mock] ${lead.company} + TrueHorizon — quick thought on ${lead.industry.toLowerCase()}`,
    body: `Hi ${firstName},\n\nSaw that ${lead.company} is scaling in ${lead.industry.toLowerCase()} — the ${topReason} is exactly the kind of setup where AI automation tends to pay off fast. That's close to ${proof}, which is why I'm reaching out directly rather than going through a generic pitch.\n\nWorth a 15-minute call next week to see if there's a fit for ${lead.company} specifically?\n\n— TrueHorizon`,
    source: "mock",
  };
}
