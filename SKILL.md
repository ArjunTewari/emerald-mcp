---
name: emerald-report
description: Generate a complete Emerald AI competitive intelligence report for Indian air quality organisations. Use whenever the user asks to "generate an Emerald AI report" for one or more orgs over a date range.
---

# Emerald AI — Report Generation Skill

Uses the **emerald-ai-agentic MCP server** tools. The MCP server handles all data
collection, HTML template, canonical queries, and keywords internally.

---

## HOW TO INVOKE

```
Generate an Emerald AI report for CEEW from 2026-08-01 to 2026-08-31.
```

```
Generate an Emerald AI report for CEEW, WRI India, CSE India from 2026-07-01 to 2026-07-31. Client: Prakriti Foundation.
```

---

## MANDATORY STEPS — follow in this exact order

### Step 1 — Always call `get_report_instructions` first
This is non-negotiable. Call it with no arguments before doing anything else.
It returns the full HTML template, scoring formulas, canonical AEO questions,
keyword lists, query formats, and section structure. Follow those instructions exactly.

### Step 2 — Collect data using only these MCP tools
- `get_org_history` — past metrics per org (call for every org)
- `search_news` — news/media coverage via Firecrawl
- `search_web` — web fallback search
- `scrape_url` — scrape a specific URL for full article text
- `get_linkedin_posts` — LinkedIn AQ posts + ER
- `get_twitter_posts` — X/Twitter AQ posts + ER
- `get_instagram_posts` — Instagram AQ posts + ER
- `get_youtube_stats` — YouTube channel subscribers + video count
- `query_ai_for_mentions` — AEO scoring (run all 15 canonical questions per org)

### Step 3 — Save metrics and report
- `save_org_metrics` — save each org's metrics for trend tracking
- `save_report` — save the completed HTML (pass `orgs` list for billing)

---

## RULES

- Never skip `get_report_instructions` — it contains the template and all canonical data
- Only process orgs the user explicitly named
- Every number must come from a real tool result — no estimating
- API failures → show `0` with a hover tooltip for the reason
- Missing handle → `—` (counts as 0 in scoring)
