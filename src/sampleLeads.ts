import type { Lead } from "./types.js";

// Fictional sample leads for the demo — not real people/companies.
// Shaped to drop in Crustdata person-enrichment data later (name/current_title/
// employment_details.current[].company -> name/title/company here).
export const sampleLeads: Lead[] = [
  { id: "L1", name: "A. Rivera", title: "VP Engineering", company: "Northstar Labs", companySize: "51-200", industry: "AI/ML", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L2", name: "B. Chen", title: "Head of Product", company: "Cedar Cloud", companySize: "201-1000", industry: "Cloud Infra", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L3", name: "C. Patel", title: "Marketing Associate", company: "Brightline Media", companySize: "11-50", industry: "Media", isDecisionMaker: false, hasActiveAIProject: false },
  { id: "L4", name: "D. Nwosu", title: "CTO", company: "Fenwick Robotics", companySize: "11-50", industry: "Robotics", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L5", name: "E. Fontaine", title: "Data Scientist", company: "Cedar Cloud", companySize: "201-1000", industry: "Cloud Infra", isDecisionMaker: false, hasActiveAIProject: true },
  { id: "L6", name: "F. Osei", title: "Founder & CEO", company: "Lumen Health AI", companySize: "1-10", industry: "AI/ML", isDecisionMaker: true, hasActiveAIProject: true },
  { id: "L7", name: "G. Takahashi", title: "Procurement Manager", company: "Delta Logistics", companySize: "1000+", industry: "Logistics", isDecisionMaker: false, hasActiveAIProject: false },
  { id: "L8", name: "H. Okafor", title: "Director of Engineering", company: "Vireo Robotics", companySize: "51-200", industry: "Robotics", isDecisionMaker: true, hasActiveAIProject: true },
];

export const sampleICP = {
  targetCompanySizes: ["11-50", "51-200", "201-1000"] as Lead["companySize"][],
  targetIndustries: ["AI/ML", "Cloud Infra", "Robotics"],
  requireDecisionMaker: true,
};
