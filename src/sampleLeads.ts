import type { Lead } from "./types.js";

// Fictional sample leads for the demo — not real people/companies.
export const sampleLeads: Lead[] = [
  { id: "L1", name: "A. Rivera", title: "VP Engineering", company: "Northstar Labs", companySize: "51-200", industry: "AI/ML", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L2", name: "B. Chen", title: "Head of Product", company: "Cedar Cloud", companySize: "201-1000", industry: "Cloud Infra", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L3", name: "C. Patel", title: "Marketing Associate", company: "Brightline Media", companySize: "11-50", industry: "Media", isDecisionMaker: false, hasActiveAIProject: false },
  { id: "L4", name: "D. Nwosu", title: "CTO", company: "Fenwick Robotics", companySize: "11-50", industry: "Robotics", isDecisionMaker: true, hasActiveAIProject: true },
];

export const sampleICP = {
  targetCompanySizes: ["11-50", "51-200", "201-1000"] as Lead["companySize"][],
  targetIndustries: ["AI/ML", "Cloud Infra", "Robotics"],
  requireDecisionMaker: true,
};
