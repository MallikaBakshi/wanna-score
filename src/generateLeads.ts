import { writeFileSync } from "node:fs";
import type { Lead } from "./types.js";

const FIRST = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "I.", "J.", "K.", "L.", "M.", "N.", "O.", "P."];
const LAST = ["Rivera", "Chen", "Patel", "Nwosu", "Fontaine", "Osei", "Takahashi", "Okafor", "Kowalski", "Silva", "Haddad", "Novak", "Dubois", "Kim", "Mensah", "Larsen"];
const TITLES = ["VP Engineering", "Head of Product", "Marketing Associate", "CTO", "Data Scientist", "Founder & CEO", "Procurement Manager", "Director of Engineering", "Software Engineer", "Sales Rep", "COO", "ML Engineer"];
const DECISION_TITLES = new Set(["VP Engineering", "Head of Product", "CTO", "Founder & CEO", "Director of Engineering", "COO"]);
const COMPANIES = ["Northstar Labs", "Cedar Cloud", "Brightline Media", "Fenwick Robotics", "Lumen Health AI", "Delta Logistics", "Vireo Robotics", "Halcyon Systems", "Quill Analytics", "Perch Dynamics", "Ashgrove Partners", "Tandem Robotics", "Meridian Tax Solutions", "Polyglot Media Group", "Garrison Financial Group", "Vireo Enterprise Software"];
const SIZES: Lead["companySize"][] = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const REVENUE: Lead["annualRevenue"][] = ["<$10M", "$10M-100M", "$100M-1B", "$1B+"];
const INDUSTRIES = [
  "Tax & Compliance", "Media & Localization", "Recruitment & Staffing", "Procurement & Supply Chain",
  "Entertainment & Hospitality", "Financial Services", "Enterprise SaaS", "Healthcare", "Legal Services",
  "Manufacturing", "Retail", "Energy & Utilities", "Consumer & eCommerce",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 55% chance of drawing from the "weighted" half of a list vs the full list —
// biases the synthetic set toward ICP-relevant profiles (first N entries)
// without faking anything; still real variation, just not uniform-random.
function pickWeighted<T>(arr: T[], weightedCount: number): T {
  if (Math.random() < 0.55) return pick(arr.slice(0, weightedCount));
  return pick(arr);
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
      companySize: pickWeighted(SIZES, 3), // biases toward 51-200/201-1000/1000+
      industry: pick(INDUSTRIES),
      annualRevenue: pickWeighted(REVENUE, 3), // biases toward $10M-100M/$100M-1B/$1B+
      isDecisionMaker: DECISION_TITLES.has(title),
      hasActiveAIProject: Math.random() > 0.45,
    });
  }
  return leads;
}

const count = Number(process.argv[2] ?? 1000);
const leads = generateLeads(count);
writeFileSync(new URL("../data/leads-generated.json", import.meta.url), JSON.stringify(leads, null, 2));
console.log(`Generated ${leads.length} synthetic leads -> data/leads-generated.json`);
