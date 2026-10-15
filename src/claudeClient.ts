import type { Lead, ScoreResult } from "./types.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export type OutreachDraft = {
  leadId: string;
  subject: string;
  body: string;
  source: "claude-api" | "mock";
};

/**
 * Drafts a short, personalized outreach email for one qualified lead,
 * citing Jev's actual match reasons. Falls back to a template draft when
 * ANTHROPIC_API_KEY isn't set, so the feature stays demoable without it.
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
        max_tokens: 250,
        messages: [
          {
            role: "user",
            content: `Write a short, specific cold outreach email (plain text, no markdown) for TrueHorizon (an enterprise AI automation consultancy) reaching out to this qualified lead:
Name: ${lead.name}
Title: ${lead.title}
Company: ${lead.company}
Industry: ${lead.industry}
Match reasons (from our ICP scoring, score ${score.score}/100): ${score.matchReasons.join(", ")}

Reference the specific match reasons naturally. 3-4 sentences max. Reply in this exact format:
SUBJECT: <subject line>
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
  const reasons = score.matchReasons.join(", ").toLowerCase();
  return {
    leadId: lead.id,
    subject: `[mock] Quick idea for ${lead.company}`,
    body: `Hi ${lead.name.split(" ")[0]},\n\nNoticed ${lead.company} is a strong fit for what we do at TrueHorizon — specifically ${reasons}. We've helped similar ${lead.industry} teams automate high-volume decisions with measurable ROI. Worth a 15-minute call?\n\n— TrueHorizon`,
    source: "mock",
  };
}
