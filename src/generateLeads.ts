import { writeFileSync } from "node:fs";
import type { Lead } from "./types.js";

const FIRST = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "I.", "J.", "K.", "L.", "M.", "N.", "O.", "P."];
const LAST = ["Rivera", "Chen", "Patel", "Nwosu", "Fontaine", "Osei", "Takahashi", "Okafor", "Kowalski", "Silva", "Haddad", "Novak", "Dubois", "Kim", "Mensah", "Larsen"];
const TITLES = ["VP Engineering", "Head of Product", "Marketing Associate", "CTO", "Data Scientist", "Founder & CEO", "Procurement Manager", "Director of Engineering", "Software Engineer", "Sales Rep", "COO", "ML Engineer"];
const DECISION_TITLES = new Set(["VP Engineering", "Head of Product", "CTO", "Founder & CEO", "Director of Engineering", "COO"]);
const COMPANIES = ["Northstar Labs", "Cedar Cloud", "Brightline Media", "Fenwick Robotics", "Lumen Health AI", "Delta Logistics", "Vireo Robotics", "Halcyon Systems", "Quill Analytics", "Perch Dynamics", "Ashgrove Partners", "Tandem Robotics"];
const SIZES: Lead["companySize"][] = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const INDUSTRIES = ["AI/ML", "Cloud Infra", "Media", "Robotics", "Logistics", "Fintech", "Healthcare"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLeads(count: number): Lead[] {
  const leads: Lead[] = [];
  for (let i = 0; i < count; i++) {
    const title = pick(TITLES);
    leads.push({
      id: `GEN-${i + 1}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      title,
      company: pick(COMPANIES),
      companySize: pick(SIZES),
      industry: pick(INDUSTRIES),
      isDecisionMaker: DECISION_TITLES.has(title),
      hasActiveAIProject: Math.random() > 0.5,
    });
  }
  return leads;
}

const count = Number(process.argv[2] ?? 1000);
const leads = generateLeads(count);
writeFileSync(new URL("../data/leads-generated.json", import.meta.url), JSON.stringify(leads, null, 2));
console.log(`Generated ${leads.length} synthetic leads -> data/leads-generated.json`);
