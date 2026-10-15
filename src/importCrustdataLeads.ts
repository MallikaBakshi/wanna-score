import "dotenv/config";
import { writeFileSync } from "node:fs";
import type { Lead } from "./types.js";

// Pulls REAL people from Crustdata's person-search API and maps them into
// our Lead schema. Output is gitignored (data/leads-crustdata*.json) — this
// is licensed data on real individuals, it must never go in the public repo.
//
// Verified: POST https://api.crustdata.com/person/search, max 100/page,
// cursor-based pagination (docs.crustdata.com/person-docs/search).

const CRUSTDATA_API_KEY = process.env.CRUSTDATA_API_KEY;
const PAGES = Number(process.argv[2] ?? 3); // 3 pages x 100 = 300 real leads by default
const TITLES = ["VP Engineering", "Head of Product", "CTO", "Founder", "Director of Engineering", "COO", "VP Operations"];

if (!CRUSTDATA_API_KEY) {
  console.error("CRUSTDATA_API_KEY not set in .env");
  process.exit(1);
}

function mapHeadcountToSize(range: string | undefined): Lead["companySize"] {
  if (!range) return "11-50";
  const n = parseInt(range.split("-")[0] ?? "0", 10);
  if (n >= 1000) return "1000+";
  if (n >= 201) return "201-1000";
  if (n >= 51) return "51-200";
  if (n >= 11) return "11-50";
  return "1-10";
}

// Crustdata person-search doesn't return company revenue directly — this is
// a rough estimate from headcount as a stand-in until a company-enrichment
// call is added. Flagged explicitly, not presented as verified data.
function estimateRevenue(headcount: number | undefined): Lead["annualRevenue"] {
  if (!headcount) return "<$10M";
  if (headcount >= 1000) return "$1B+";
  if (headcount >= 200) return "$100M-1B";
  if (headcount >= 50) return "$10M-100M";
  return "<$10M";
}

async function searchPage(title: string, cursor: string | null): Promise<any> {
  const body: any = {
    filters: {
      op: "and",
      conditions: [{ field: "experience.employment_details.current.title", type: "(.)", value: title }],
    },
    limit: 100,
  };
  if (cursor) body.cursor = cursor;

  const res = await fetch("https://api.crustdata.com/person/search", {
    method: "POST",
    headers: {
      authorization: `Bearer ${CRUSTDATA_API_KEY}`,
      "content-type": "application/json",
      "x-api-version": "2025-11-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Crustdata error for "${title}": ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function mapProfile(p: any): Lead | null {
  const current = p.experience?.employment_details?.current?.[0];
  if (!current) return null;

  return {
    id: `CD-${p.crustdata_person_id}`,
    name: p.basic_profile?.name ?? "Unknown",
    title: current.title ?? p.basic_profile?.current_title ?? "Unknown",
    company: current.name ?? "Unknown",
    companySize: mapHeadcountToSize(current.company_headcount_range),
    industry: current.company_industries?.[0] ?? "Enterprise SaaS",
    annualRevenue: estimateRevenue(current.company_headcount_latest),
    isDecisionMaker: ["CXO", "VP", "Director"].some((lvl) => (current.seniority_level ?? "").includes(lvl)),
    hasActiveAIProject: false, // no signal available from this endpoint
  };
}

const outPath = new URL("../data/leads-crustdata.json", import.meta.url);

function save(leads: Lead[]) {
  writeFileSync(outPath, JSON.stringify(leads, null, 2));
}

async function main() {
  const leads: Lead[] = [];
  const seen = new Set<string>();

  for (const title of TITLES) {
    let cursor: string | null = null;
    for (let page = 0; page < PAGES; page++) {
      const data = await searchPage(title, cursor);
      for (const p of data.profiles ?? []) {
        const lead = mapProfile(p);
        if (lead && !seen.has(lead.id)) {
          seen.add(lead.id);
          leads.push(lead);
        }
      }
      console.log(`  "${title}" page ${page + 1}: +${data.profiles?.length ?? 0} (total so far: ${leads.length})`);
      save(leads); // write after every page — a later failure doesn't lose what we already paid for
      cursor = data.next_cursor;
      if (!cursor) break;
    }
  }

  console.log(`\nSaved ${leads.length} real leads -> data/leads-crustdata.json (gitignored, local only)`);
}

main().catch((err) => {
  console.error("Import failed partway through:", err.message);
  console.error("Whatever was fetched before the failure is still saved in data/leads-crustdata.json");
  process.exit(1);
});
