import type { Lead } from "./types.js";

// Fictional sample leads for the demo — not real people/companies.
// Shaped to drop in Crustdata person-enrichment data later (name/current_title/
// employment_details.current[].company -> name/title/company here).
//
// Industries below are grounded in TrueHorizon.ai's actual public case
// studies (truehorizon.ai/customers): tax compliance, media/localization,
// recruitment, procurement, entertainment, plus enterprise clients like
// JP Morgan / Salesforce / BarkBox — i.e. TrueHorizon sells across many
// verticals, not one niche. The ICP below reflects that as a *default*;
// it's fully editable in the UI (chips can be toggled per-industry/size).
export const sampleLeads: Lead[] = [
  { id: "L1", name: "A. Rivera", title: "VP Tax Technology", company: "Meridian Tax Solutions", companySize: "1000+", industry: "Tax & Compliance", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L2", name: "B. Chen", title: "Head of Localization", company: "Polyglot Media Group", companySize: "201-1000", industry: "Media & Localization", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L3", name: "C. Patel", title: "Recruiting Coordinator", company: "Brightline Staffing", companySize: "11-50", industry: "Recruitment & Staffing", isDecisionMaker: false, hasActiveAIProject: false },
  { id: "L4", name: "D. Nwosu", title: "Director of Procurement", company: "Fenwick Supply Co.", companySize: "1000+", industry: "Procurement & Supply Chain", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L5", name: "E. Fontaine", title: "VP Operations", company: "Highline Entertainment Venues", companySize: "201-1000", industry: "Entertainment & Hospitality", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L6", name: "F. Osei", title: "Head of AI Automation", company: "Garrison Financial Group", companySize: "1000+", industry: "Financial Services", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L7", name: "G. Takahashi", title: "Customer Support Rep", company: "Pawfect Goods Co.", companySize: "201-1000", industry: "Consumer & eCommerce", isDecisionMaker: false, hasActiveAIProject: false },
  { id: "L8", name: "H. Okafor", title: "Chief Operating Officer", company: "Vireo Enterprise Software", companySize: "1000+", industry: "Enterprise SaaS", isDecisionMaker: true, hasActiveAIProject: true },
];

export const sampleICP = {
  targetCompanySizes: ["201-1000", "1000+"] as Lead["companySize"][],
  targetIndustries: [
    "Tax & Compliance",
    "Media & Localization",
    "Recruitment & Staffing",
    "Procurement & Supply Chain",
    "Entertainment & Hospitality",
    "Financial Services",
    "Enterprise SaaS",
  ],
  requireDecisionMaker: true,
};
