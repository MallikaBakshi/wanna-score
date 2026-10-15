// SHARED CONTRACT — do not change without syncing with your teammate.

export type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  companySize: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
  industry: string;
  isDecisionMaker: boolean;
  hasActiveAIProject: boolean;
};

export type ICP = {
  targetCompanySizes: Lead["companySize"][];
  targetIndustries: string[];
  requireDecisionMaker: boolean;
};

export type ScoreResult = {
  leadId: string;
  score: number; // 0-100
  matchReasons: string[];
  category: "strong-match" | "possible-match" | "poor-match";
  source: "jev-api" | "mock";
  latencyMs: number;
};

// POST /api/score-lead
export type ScoreLeadRequest = { lead: Lead; icp: ICP };
export type ScoreLeadResponse = ScoreResult;

// POST /api/score-leads (batch)
export type ScoreLeadsRequest = { leads: Lead[]; icp: ICP };
export type ScoreLeadsResponse = ScoreResult[];
