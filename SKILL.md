---
name: emerald-report
description: Generate a complete Emerald AI competitive intelligence report for Indian air quality organisations. Use whenever the user asks to "generate an Emerald AI report" for one or more orgs over a date range.
---

# Emerald AI — Report Generation Skill

Uses the **APIdirect connector** and **Firecrawl plugin** connected to this session. No external MCP server needed.

---

## HOW TO INVOKE

```
Generate an Emerald AI report for CEEW from 2026-08-01 to 2026-08-31.
```

```
Generate an Emerald AI report for CEEW, WRI India, CSE India from 2026-07-01 to 2026-07-31. Client: Prakriti Foundation.
```

---

## STEP 0 — PARSE THE REQUEST

Extract from the user's message only:
- **ORGS** — exact organisations to analyse (only these, nothing else)
- **DATE_FROM** — start date (YYYY-MM-DD)
- **DATE_TO** — end date (YYYY-MM-DD)
- **CLIENT_NAME** — if provided, else "Client"

---

## STEP 1 — COLLECT DATA (per org, in parallel where possible)

### 1A — News & Media Coverage
Use **Firecrawl search** for each org. Run 3–5 queries:
- `"{org}" air quality {month} {year}`
- `"{org}" AQI PM2.5 pollution {year}`
- `"{org}" NCAP clean air {year}`
- `"{org}" air pollution report OR study {year}`

Use the `firecrawl search` tool with `--sources news` and `--tbs` date filter to restrict to the report period.

Classify each result as **Online / Print / TV**.

**URL verification (mandatory):** For every article URL found, run `firecrawl scrape <url>` to confirm it loads. If the scrape returns a 404 or empty body:
1. Search for the exact article headline in quotes to find the live URL.
2. If still not found, record the article with `url: null` and a note "URL unverified".
Never record a URL that has not been confirmed to load.

Fallback: `mcp__apidirect__search_news` with the same queries.

### 1B — Social Media
For each org, use APIdirect tools. If you don't know a handle, use the search tool first.

#### LinkedIn
1. Find company: `mcp__apidirect__search_linkedin_companies` → query = org name
2. Get posts: `mcp__apidirect__linkedin_company_posts` → use the company URL/id from step 1
3. Get details: `mcp__apidirect__linkedin_company_details` → for follower count

Filter posts to the report date range. Count AQ-relevant posts only (keywords: air quality, AQI, PM2.5, PM10, NCAP, pollution, clean air, smog, GRAP).

ER% = (total likes + comments + shares) ÷ post_count ÷ followers × 100

#### Twitter / X
1. Find handle: `mcp__apidirect__search_twitter_users` → query = org name + "india"
2. Get profile: `mcp__apidirect__twitter_user_profile` → username from step 1
3. Get tweets: `mcp__apidirect__twitter_user_tweets` → username, filter to date range

Count AQ-relevant tweets. ER% = (likes + replies + retweets) ÷ followers × 100

#### Instagram
1. Find handle: `mcp__apidirect__search_instagram_users` → query = org name
2. Get posts: `mcp__apidirect__instagram_user_posts` → username from step 1
3. Get profile: `mcp__apidirect__instagram_user_profile` → for follower count

Filter to date range + AQ keywords. ER% = (likes + comments) ÷ followers × 100

#### YouTube
1. Find channel: `mcp__apidirect__search_youtube_channels` → query = org name
2. Get details: `mcp__apidirect__youtube_channel_details` → channel_id from step 1

Count videos published in the date range. Subscribers from channel details.

**If a handle lookup returns no results:** ask the user for the handle, then retry.

**If a tool call fails:** try once with a simpler query; if still failing, record 0 for that platform with a note.

### 1C — AEO (AI Engine Visibility)
Search: `mcp__apidirect__search_web` with queries like:
- `"{org}" cited air quality india site:perplexity.ai`
- `"{org}" air quality india AI answer`
- `"{org}" mentioned OR cited air pollution report 2026`

Count distinct AI-platform pages where the org is cited as a source. `ai_mentions` = that count.

---

## STEP 2 — SCORE EACH ORG

### Social Score (max 100)
```
LinkedIn:  min((posts × 3) + (ER% × 10), 40)
Twitter:   min((posts × 1.5) + (ER% × 5), 20)
Instagram: min((posts × 2) + (ER% × 8), 20)
YouTube:   min((videos × 2) + (subscribers ÷ 5000), 20)
Social Score = sum of above
```

### Media Score (max 100)
```
Online:  min(count × 5, 50)
Print:   min(count × 8, 30)
TV:      min(count × 10, 20)
Media Score = sum of above
```

### AEO Score (max 100)
```
AEO Score = min(ai_mentions × 20, 100)
```

### Overall Score
```
Overall = (Social × 0.4) + (Media × 0.4) + (AEO × 0.2)
```

### SoV%
```
SoV% = org_overall ÷ sum_of_all_org_overalls × 100
```

Rank by Overall descending. Tied orgs → same rank, alphabetical order, next rank skips.

---

## STEP 3 — WRITE THE HTML REPORT

Use exactly this CSS, structure, and JavaScript. Do not change colors, class names, font choices, or section order. Fill in all `{PLACEHOLDER}` values from the data you collected.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Emerald AI — {CLIENT_NAME} Air Quality Intelligence Report</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#0a0e17;--surface:#111520;--surface2:#181e2e;--surface3:#1e2638;--border:#252d40;--border2:#6b7e9a;--text:#d8e4f0;--muted:#5e7494;--muted2:#8fa3b8;--amber:#c9922a;--amber-dim:rgba(201,146,42,.12);--amber-glow:rgba(201,146,42,.06);--good:#4caf74;--warn:#d4a017;--bad:#e05c5c}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:var(--ink);color:var(--text);line-height:1.65;font-size:19px}
.shell{display:flex;min-height:100vh}
.sidenav{width:220px;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto;background:var(--surface);border-right:1px solid var(--border);padding:28px 0;display:flex;flex-direction:column}
.sidenav-logo{padding:0 20px 24px;border-bottom:1px solid var(--border);margin-bottom:16px}
.sidenav-logo-name{font-size:16px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--amber)}
.sidenav-logo-sub{font-size:15px;color:var(--muted);margin-top:2px;font-family:monospace}
.nav-lbl{font-size:14px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);padding:12px 20px 6px}
.nav-a{display:block;padding:7px 20px;font-size:17px;color:var(--muted2);text-decoration:none;border-left:2px solid transparent}
.nav-a:hover{color:var(--text);background:var(--surface2)}.nav-a.active{color:var(--amber);border-left-color:var(--amber);background:var(--amber-glow)}
.sidenav-footer{margin-top:auto;padding:16px 20px 0;border-top:1px solid var(--border);font-family:monospace;font-size:15px;color:var(--muted);line-height:1.8}
.main{flex:1;min-width:0;padding:0 48px 80px}
.rh{padding:52px 0 44px;border-bottom:1px solid var(--border);margin-bottom:48px}
.ey{font-family:monospace;font-size:16px;color:var(--amber);letter-spacing:.12em;text-transform:uppercase;margin-bottom:14px}
.rt{font-family:'DM Serif Display',serif;font-size:47px;line-height:1.15;margin-bottom:10px;font-weight:400}
.rti{color:var(--amber);font-style:italic}
.rm{font-size:18px;color:var(--muted2);margin-bottom:28px;font-family:monospace}
.chips{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.chip{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:4px;font-size:17px;font-weight:600}
.dn{background:var(--amber-glow);border:1px solid rgba(201,146,42,.2);border-radius:6px;padding:11px 16px;font-size:17px;color:var(--muted2);font-family:monospace}
.dn strong{color:var(--amber)}
.sec{margin-bottom:56px;scroll-margin-top:24px;position:relative}
.sh{margin-bottom:24px}
.se{font-family:monospace;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.st{font-family:'DM Serif Display',serif;font-size:33px;font-weight:400;color:var(--text);line-height:1.2}
.sd{margin-top:8px;font-size:18px;color:var(--muted2);max-width:680px}
.sdiv{width:40px;height:2px;background:var(--amber);margin:14px 0 0}
.nt,.at,.apt{width:100%;border-collapse:collapse;font-size:17px;margin-bottom:16px}
.nt th,.at th,.apt th{background:var(--surface3);padding:10px 14px;text-align:left;font-family:monospace;font-size:15px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)}
.nt td,.at td,.apt td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:top}
.nt tr:hover td{background:var(--surface2)}
.scc{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:20px}
.sca{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:22px;text-align:center}
.scn{font-size:16px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
.scg{font-family:'DM Serif Display',serif;font-size:49px;line-height:1;margin:8px 0 4px;font-weight:400}
.scs{font-family:monospace;font-size:18px;color:var(--muted2);margin-bottom:14px}
.scf{background:var(--surface3);border:1px solid var(--border);border-radius:6px;padding:12px 16px;font-family:monospace;font-size:16px;color:var(--muted2);margin-top:8px}
.scf strong{color:var(--amber)}
#score table{width:100%;border-collapse:collapse;font-size:17px}
#score table tbody tr{border-bottom:1px solid var(--border)}
#score table tbody tr:hover{background:var(--surface2)}
#score table td{padding:12px 12px;vertical-align:middle}
#score table thead th{padding:10px 12px;background:var(--surface3);font-family:monospace;font-size:15px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);text-align:left}
.fc{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:20px 22px;display:flex;gap:18px;align-items:flex-start;margin-bottom:14px}
.fn{font-family:'DM Serif Display',serif;font-size:41px;color:var(--amber);line-height:1;flex-shrink:0;opacity:.45;margin-top:2px}
.fb{flex:1}.fh{font-size:20px;font-weight:600;color:var(--text);margin-bottom:6px;line-height:1.4}
.fd{font-size:18px;color:var(--muted2);line-height:1.65}
.pri-fix{display:inline-block;background:rgba(212,160,23,.12);color:var(--warn);border:1px solid rgba(212,160,23,.3);border-radius:3px;padding:2px 8px;font-family:monospace;font-size:15px;font-weight:600;white-space:nowrap}
.pri-lev{display:inline-block;background:rgba(76,175,116,.12);color:var(--good);border:1px solid rgba(76,175,116,.3);border-radius:3px;padding:2px 8px;font-family:monospace;font-size:15px;font-weight:600;white-space:nowrap}
.pri-opt{display:inline-block;background:rgba(61,142,240,.1);color:#3d8ef0;border:1px solid rgba(61,142,240,.25);border-radius:3px;padding:2px 8px;font-family:monospace;font-size:15px;font-weight:600;white-space:nowrap}
.pri-inv{display:inline-block;background:rgba(224,92,92,.1);color:var(--bad);border:1px solid rgba(224,92,92,.25);border-radius:3px;padding:2px 7px;font-family:monospace;font-size:15px;font-weight:600;white-space:nowrap}
.em-card{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:18px 20px;margin-bottom:12px}
.em-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:12px}
.em-topic{font-size:19px;font-weight:600;color:var(--text)}
.em-mom{font-family:monospace;font-size:16px;color:var(--good);background:rgba(76,175,116,.1);border:1px solid rgba(76,175,116,.25);border-radius:3px;padding:2px 8px;flex-shrink:0}
.em-body{font-size:18px;color:var(--muted2);line-height:1.65;margin-bottom:10px}
.edit-bar{position:fixed;top:14px;right:18px;z-index:2000;display:flex;gap:8px;align-items:center}
.edit-btn{background:#1e2638;border:1px solid var(--border2);border-radius:5px;padding:6px 13px;font-family:monospace;font-size:16px;color:var(--muted2);cursor:pointer;transition:all .15s;line-height:1.4}
.edit-btn:hover,.edit-btn.on{background:rgba(201,146,42,.15);border-color:rgba(201,146,42,.4);color:var(--amber)}
.edit-dl{color:var(--good)!important;border-color:rgba(76,175,116,.3)!important;background:rgba(76,175,116,.07)!important;display:none}
body.edit-mode .edit-dl{display:inline-block}
body.edit-mode [contenteditable="true"]:hover{outline:1.5px dashed rgba(201,146,42,.55);border-radius:2px;cursor:text}
body.edit-mode [contenteditable="true"]:focus{outline:1.5px solid rgba(201,146,42,.7);border-radius:2px}
.rf{border-top:1px solid var(--border);padding:28px 0 0;font-family:monospace;font-size:15px;color:var(--muted);line-height:2}
@media(max-width:900px){
  .sidenav{display:none}
  .main{padding:24px 20px 60px;max-width:100%}
  .rh{padding:32px 0 28px;margin-bottom:32px}
  .rt{font-size:33px}.st{font-size:27px}.sd{font-size:17px}
  .scc{grid-template-columns:1fr}
  .fc{flex-direction:column;gap:10px}.fn{font-size:31px}
  .scg{font-size:37px}
  .edit-bar{top:8px;right:8px;gap:5px}
  .nt,.at,.apt{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}
  #score table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}
}
@media(max-width:480px){
  .main{padding:16px 14px 60px}.rt{font-size:25px}.st{font-size:23px}
  .sec{margin-bottom:36px}.scg{font-size:31px}.ey{font-size:14px;letter-spacing:.08em}
}
@media(max-width:380px){
  .main{padding:12px 10px 60px}.rt{font-size:22px}.st{font-size:21px}
  .chip{font-size:15px;padding:4px 8px}.rm,.sd{font-size:14px}
}
.mob-nav{display:none}
@media(max-width:900px){
  body{overflow-x:hidden}
  .shell{display:block!important}
  .mob-nav{display:flex;overflow-x:auto;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;padding:0;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .mob-nav::-webkit-scrollbar{display:none}
  .mob-nav a{padding:11px 14px;font-size:16px;font-weight:600;color:var(--muted2);text-decoration:none;white-space:nowrap;letter-spacing:.04em;flex-shrink:0;border-bottom:2px solid transparent}
  .mob-nav a:active{color:var(--amber);border-bottom-color:var(--amber)}
}
@media print{
  .sidenav,.edit-bar,.mob-nav{display:none!important}
  .main{padding:16px!important}
  .shell{display:block!important}
  body{overflow-x:visible!important}
  .sec{page-break-inside:avoid}
  a[href]:after{content:""}
}
</style>
</head>
<body>
<div class="edit-bar" id="edit-bar">
  <button class="edit-btn" id="edit-btn" onclick="toggleEdit()">&#9998; Edit Mode</button>
  <button class="edit-btn edit-dl" id="dl-btn" onclick="dlEdit()">&#8595; Download Edited</button>
</div>
<div class="shell">
<nav class="sidenav">
  <div class="sidenav-logo">
    <div class="sidenav-logo-name">Emerald AI</div>
    <div class="sidenav-logo-sub">Air Quality Intelligence</div>
  </div>
  <div class="nav-lbl">Report</div>
  <a href="#exec" class="nav-a active">Executive Summary</a>
  <div class="nav-lbl">Press</div>
  <a href="#sov" class="nav-a">Press Analytics</a>
  <div class="nav-lbl">Social Media</div>
  <a href="#social" class="nav-a">Social Media</a>
  <div class="nav-lbl">LLM</div>
  <a href="#aeo" class="nav-a">LLM Visibility</a>
  <div class="nav-lbl">Conclusions</div>
  <a href="#score" class="nav-a">Scorecard</a>
  <a href="#actions" class="nav-a">Action Matrix</a>
  <a href="#em" class="nav-a">Emerging Narratives</a>
  <div class="sidenav-footer">
    Generated: {GENERATED_DATE}<br>
    <!-- Per-org color key: for each org add one line:
    <div style="display:flex;align-items:center;gap:6px;font-size:16px;color:var(--muted2);padding:3px 0">
      <div style="width:8px;height:8px;border-radius:2px;background:{ORG_COLOR}"></div>{ORG}: {N} arts
    </div>
    -->
    CONFIDENTIAL<br>
    <span style="display:inline-block;margin-top:6px;padding:4px 8px;background:rgba(212,160,23,.12);border:1px solid rgba(212,160,23,.3);border-radius:4px;color:var(--amber);font-weight:700">Emerald AI</span>
  </div>
</nav>
<nav class="mob-nav">
  <a href="#exec">Summary</a>
  <a href="#sov">Press</a>
  <a href="#social">Social</a>
  <a href="#aeo">LLM</a>
  <a href="#score">Score</a>
  <a href="#actions">Actions</a>
  <a href="#em">Narratives</a>
</nav>
<main class="main">

  <header class="rh">
    <div class="ey">Air Quality Media Intelligence · India</div>
    <h1 class="rt">Triple Media<br><span class="rti">Intelligence Report</span></h1>
    <div class="rm">Period: {DATE_FROM} → {DATE_TO} · Generated {GENERATED_DATE}</div>
    <div class="chips">
      <!-- One chip per org. Pick color from palette below. Example:
      <span class="chip" style="background:rgba(201,146,42,.12);color:#c9922a;border:1px solid rgba(201,146,42,.2)">
        <span style="width:8px;height:8px;border-radius:2px;background:#c9922a;display:inline-block"></span>CEEW
      </span>
      Org color palette (assign in order, reuse as needed):
        #c9922a  #06b6d4  #84cc16  #f97316  #8b5cf6  #e05c5c  #3d8ef0
        #4caf74  #ec4899  #a371f7  #e05c3a  #14b8a6  #ef4444
      -->
    </div>
    <div class="dn"><strong>Publicly available data only.</strong> All figures sourced from platform APIs and web search. No non-public data used. Review all numbers before sharing externally.</div>
  </header>

  <!-- ═══════════════════════════════════════════════════════════════
       SECTION 01 — EXECUTIVE SUMMARY
       INTERNAL ONLY — remove this entire <section> block plus its
       sidenav/mob-nav <a> links for the client version
       ═══════════════════════════════════════════════════════════════ -->
  <section class="sec" id="exec">
    <div class="sh">
      <div class="se">Section 01</div>
      <h2 class="st">Executive Summary</h2>
      <div class="sd">Key findings and strategic insights. Verify all numbers against the tables below before sharing externally.</div>
      <div class="sdiv"></div>
    </div>
    <!-- Collapsible draft exec summary -->
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;cursor:pointer;user-select:none"
           onclick="var p=this.nextElementSibling;p.style.display=p.style.display==='none'?'block':'none'">
        <div style="font-family:monospace;font-size:16px;font-weight:700;color:var(--amber)">Draft Executive Summary</div>
        <div style="font-family:monospace;font-size:15px;color:var(--muted)">AI-generated — review before sharing ▾</div>
      </div>
      <div style="padding:0 18px 18px;display:block">
        <!-- SENTINEL: All numeric claims verified against source data tables. -->
        <div style="background:rgba(76,175,116,.08);border:1px solid rgba(76,175,116,.25);border-radius:6px;padding:10px 14px;font-family:monospace;font-size:15px;color:var(--good);margin-bottom:14px">
          ✓ SENTINEL — numeric claims verified against source data
        </div>
        <div contenteditable="false" style="font-size:18px;color:var(--muted2);line-height:1.75">
          <!-- 3–5 paragraphs. Each paragraph anchors one key finding to a number from the tables.
               Example: "CEEW published 3 AQ-relevant LinkedIn posts in August 2026 (avg 72 engagements each),
               all focused on the Clean Air Horizons 2026 event (Sep 7–8). Despite strong event-driven content
               on LinkedIn, Instagram showed zero AQ posts across 14 published that month — a critical gap
               ahead of a flagship event with high visual potential." -->
        </div>
      </div>
    </div>
    <div style="background:var(--surface3);border:1px solid var(--border);border-radius:6px;padding:12px 16px;font-family:monospace;font-size:15px;color:var(--muted2);margin-top:8px">
      Methodology: Social (40%) + Media (40%) + AEO (20%) = Overall Score. Data period: {DATE_FROM} to {DATE_TO}.
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       SECTION 02 — PRESS ANALYTICS
       ═══════════════════════════════════════════════════════════════ -->
  <section class="sec" id="sov">
    <div class="sh">
      <div class="se">Section 02</div>
      <h2 class="st">Press Analytics</h2>
      <div class="sd">AQ article counts per org, deduplicated, date-filtered.</div>
      <div class="sdiv"></div>
    </div>

    <!-- Coverage bar: one flex segment per org, width proportional to article share.
         Each segment = flex:{org_articles}, background={ORG_COLOR}, shows count inside.
         Orgs with 0 articles are omitted from the bar (they appear in the legend only). -->
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:18px 22px;margin-bottom:22px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div style="font-weight:700;font-size:19px">All AQ coverage &mdash; {C_TOTAL} articles</div>
        <div style="font-family:monospace;font-size:16px;color:var(--muted2)">{C_ONLINE_PRINT} Print / Online &middot; {C_TV} TV News</div>
      </div>
      <div style="display:flex;height:34px;border-radius:4px;overflow:hidden;margin-bottom:14px;gap:2px">
        <!-- One segment per org with articles > 0:
        <div style="flex:{N};background:{ORG_COLOR};display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:700;font-size:17px;color:#fff">{N}</div>
        Orgs with 0 omit the segment; show a "0" marker between segments if needed. -->
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;font-family:monospace;font-size:15px;color:var(--muted2)">
        <!-- One legend entry per org:
        <span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:{ORG_COLOR};margin-right:5px;vertical-align:middle"></span>{ORG}: {N}</span> -->
      </div>
    </div>

    <!-- Single outlet matrix table — no separate summary table.
         Columns: Org | Times of India | Hindustan Times | The Hindu | Indian Express | Deccan Herald
         Non-zero cells show count + expandable <details> with article sources.
         Zero cells: color:var(--muted). COHORT row first in amber. -->
    <div style="font-family:monospace;font-size:14px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Print / Online</div>
    <div style="overflow-x:auto">
      <table class="nt" style="min-width:600px">
        <thead>
          <tr>
            <th style="min-width:200px">Org</th>
            <th>Times of India</th><th>Hindustan Times</th><th>The Hindu</th><th>Indian Express</th><th>Deccan Herald</th>
          </tr>
        </thead>
        <tbody>
          <!-- COHORT row example:
          <tr>
            <td style="font-family:monospace;font-weight:700;color:var(--amber)">COHORT</td>
            <td style="font-family:monospace;font-weight:700;color:var(--amber)">{N}</td>
            ...
          </tr>

          Per-org row — non-zero outlet cell example:
          <td style="font-family:monospace;font-weight:700;color:var(--text)">
            {N}
            <details style="margin-top:5px">
              <summary style="font-family:monospace;font-size:14px;color:var(--amber);cursor:pointer;list-style:none;-webkit-appearance:none">↗ sources</summary>
              <div style="margin-top:7px">
                <a href="{URL}" style="color:var(--amber);text-decoration:none;font-size:15px" target="_blank">{HEADLINE}</a>
                <div style="font-family:monospace;font-size:13px;color:var(--muted);margin-top:3px">{TYPE} · {DATE} · {AUTHORS}</div>
              </div>
            </details>
          </td>

          Zero outlet cell:
          <td style="font-family:monospace;color:var(--muted)">0</td>
          -->
        </tbody>
      </table>
    </div>

    <!-- ── Coverage Momentum (02C) ──────────────────────────────────
         Weekly heatmap of AQ article volume per org.
         Columns = week-start dates (Mon dates: e.g. 07-27, 08-03, ...).
         Zero weeks: <td style="text-align:center;color:var(--muted)">·</td>
         Non-zero weeks: amber clickable <details>/<summary> cell. Pattern:

         <td style="text-align:center;vertical-align:top">
           <details>
             <summary style="display:inline-flex;align-items:center;justify-content:center;background:rgba(201,146,42,.22);color:var(--amber);border-radius:4px;padding:2px 9px;font-family:monospace;font-weight:700;font-size:16px;cursor:pointer;list-style:none;-webkit-appearance:none">{COUNT}
               <div style="text-align:left;margin-top:7px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;min-width:260px">
                 <a href="{URL}" style="color:var(--amber);text-decoration:none;font-size:15px;display:block;line-height:1.5" target="_blank">{HEADLINE}</a>
                 <div style="font-family:monospace;font-size:12px;color:var(--muted);margin-top:4px">{TYPE} · {OUTLET} · {DATE} · {AUTHORS}</div>
               </div>
             </summary>
           </details>
         </td>

         First row = "Press (all orgs)" aggregate. Then one row per org.
         After table: one sentence noting the spike week and its trigger event. -->
    <div style="font-family:monospace;font-size:14px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:24px 0 10px">Coverage Momentum</div>
    <div style="overflow-x:auto">
      <table class="nt">
        <thead>
          <tr>
            <th style="min-width:200px">Organisation</th><th>Total</th>
            <!-- <th>{WEEK_DATE}</th> repeat for each week -->
          </tr>
        </thead>
        <tbody><!-- "Press (all orgs)" aggregate row + one row per org --></tbody>
      </table>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       SECTION 03 — SOCIAL MEDIA
       Section label: "Section 03 · {DATE_FROM} → {DATE_TO}" (full report)
                      "Section 02" (client report — section numbers shift without exec/actions)
       ═══════════════════════════════════════════════════════════════ -->
  <section class="sec" id="social">
    <div class="sh">
      <div class="se">Section 03 &middot; {DATE_FROM} &rarr; {DATE_TO}</div>
      <h2 class="st">Social Media Presence</h2>
      <div class="sd">Shows how active each organisation is on social media during the report period — how many followers they have, how often they post about air quality, and how much engagement that content receives across LinkedIn, X/Twitter, Instagram, and YouTube.</div>
      <div class="sdiv"></div>
    </div>

    <!-- 5 summary stat cards — fill counts from data -->
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px">
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:18px 20px;flex:1;min-width:150px">
        <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin-bottom:8px;line-height:1.4">ORGS WITH AQ SOCIAL POSTS</div>
        <div style="font-family:monospace;font-size:30px;font-weight:700;color:var(--good);line-height:1">{C_ORGS_WITH_POSTS}</div>
        <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-top:5px">of {TOTAL_ORGS} tracked</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:18px 20px;flex:1;min-width:150px">
        <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#5b8fd6;text-transform:uppercase;margin-bottom:8px">LINKEDIN AQ POSTS</div>
        <div style="font-family:monospace;font-size:30px;font-weight:700;color:#5b8fd6;line-height:1">{C_LI}</div>
        <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-top:5px">LinkedIn API</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:18px 20px;flex:1;min-width:150px">
        <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text);text-transform:uppercase;margin-bottom:8px">X/TWITTER AQ TWEETS</div>
        <div style="font-family:monospace;font-size:30px;font-weight:700;color:var(--text);line-height:1">{C_X}</div>
        <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-top:5px">X API v2</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:18px 20px;flex:1;min-width:150px">
        <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#e05c9c;text-transform:uppercase;margin-bottom:8px">INSTAGRAM AQ POSTS</div>
        <div style="font-family:monospace;font-size:30px;font-weight:700;color:#e05c9c;line-height:1">{C_IG}</div>
        <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-top:5px">Instagram Graph API</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:18px 20px;flex:1;min-width:150px">
        <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#e05c5c;text-transform:uppercase;margin-bottom:8px">YOUTUBE VIDEOS</div>
        <div style="font-family:monospace;font-size:30px;font-weight:700;color:#e05c5c;line-height:1">{C_YT}</div>
        <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-top:5px">YouTube Data API v3</div>
      </div>
    </div>

    <!-- DATA SOURCES bar -->
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:18px">
      <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted)">DATA SOURCES:</span>
      <span style="background:rgba(91,143,214,.12);border:1px solid rgba(91,143,214,.3);border-radius:4px;padding:3px 10px;font-family:monospace;font-size:12px;color:#5b8fd6">LinkedIn &middot; ✓ LinkedIn API</span>
      <span style="background:rgba(200,216,232,.07);border:1px solid rgba(200,216,232,.18);border-radius:4px;padding:3px 10px;font-family:monospace;font-size:12px;color:var(--text)">X/Twitter &middot; ✓ X API v2</span>
      <span style="background:rgba(224,92,156,.1);border:1px solid rgba(224,92,156,.3);border-radius:4px;padding:3px 10px;font-family:monospace;font-size:12px;color:#e05c9c">Instagram &middot; ✓ Graph API</span>
      <span style="background:rgba(224,92,92,.1);border:1px solid rgba(224,92,92,.3);border-radius:4px;padding:3px 10px;font-family:monospace;font-size:12px;color:#e05c5c">YouTube &middot; ✓ Data API v3</span>
    </div>

    <!-- Stats table -->
    <table class="at">
      <thead>
        <tr>
          <th>#</th><th>Organisation</th>
          <th style="color:#5b8fd6">LI Posts</th><th style="color:#5b8fd6">LI ER%</th><th style="color:#5b8fd6">LI Flw</th>
          <th style="color:var(--text)">X Posts</th><th style="color:var(--text)">X ER%</th><th style="color:var(--text)">X Flw</th>
          <th style="color:#e05c9c">IG Posts</th><th style="color:#e05c9c">IG ER%</th><th style="color:#e05c9c">IG Flw</th>
          <th style="color:#e05c5c">YT Videos</th><th style="color:#e05c5c">YT Subs</th>
          <th>Social Score</th><th style="color:var(--good)">SoV%</th>
        </tr>
      </thead>
      <tbody>
        <!-- COHORT row first, then per-org sorted by Social Score desc, alpha tiebreak.

        COHORT row:
        <tr>
          <td colspan="2" style="font-family:monospace;font-weight:700;color:var(--amber)">COHORT TOTAL</td>
          <td style="font-family:monospace;font-weight:700;color:var(--amber)">{C_LI}</td><td>&mdash;</td><td>&mdash;</td>
          <td style="font-family:monospace;font-weight:700;color:var(--amber)">{C_X}</td><td>&mdash;</td><td>&mdash;</td>
          <td style="font-family:monospace;font-weight:700;color:var(--amber)">{C_IG}</td><td>&mdash;</td><td>&mdash;</td>
          <td style="font-family:monospace;font-weight:700;color:var(--amber)">{C_YT}</td><td>&mdash;</td>
          <td style="font-family:monospace;font-weight:700;color:var(--amber)">{C_SOCIAL}</td>
          <td style="font-family:monospace;font-weight:700;color:var(--amber)">100%</td>
        </tr>

        Per-org row:
        <tr>
          <td style="font-family:monospace;font-size:17px;color:var(--muted)">{RANK}</td>
          <td style="font-family:monospace;font-weight:700;color:{ORG_COLOR}">{ORG}</td>
          <td style="font-family:monospace">{LI_POSTS}</td>
          <td style="font-family:monospace">{LI_ER}%</td>
          <td style="font-family:monospace;font-size:16px;color:var(--muted2)">{LI_FLW}</td>
          <td style="font-family:monospace">{X_POSTS}</td>
          <td style="font-family:monospace">{X_ER}%</td>
          <td style="font-family:monospace;font-size:16px;color:var(--muted2)">{X_FLW}</td>
          <td style="font-family:monospace">{IG_POSTS}</td>
          <td style="font-family:monospace">{IG_ER}%</td>
          <td style="font-family:monospace;font-size:16px;color:var(--muted2)">{IG_FLW}</td>
          <td style="font-family:monospace">{YT_VIDEOS}</td>
          <td style="font-family:monospace;font-size:16px;color:var(--muted2)">{YT_SUBS}</td>
          <td style="font-family:monospace;font-weight:700;color:var(--text)">{SOCIAL_SCORE}</td>
          <td style="font-family:monospace;font-weight:700;color:var(--good)">{SOV}%</td>
        </tr>

        API failure cell: <span style="color:var(--bad);font-size:15px;cursor:help" title="{FAILURE_REASON}">0</span>
        No handle found:  <span style="color:var(--muted)">&mdash;</span>
        -->
      </tbody>
    </table>

    <!-- LEGEND box -->
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:15px 20px;font-family:monospace;font-size:13px;line-height:2.1;color:var(--muted2);margin-top:24px;margin-bottom:24px">
      <span style="color:var(--muted);font-weight:700">LEGEND</span> &middot; <span style="color:#5b8fd6">LI</span> = LinkedIn AQ posts &middot; <span style="color:var(--text)">X</span> = X/Twitter AQ posts &middot; <span style="color:#e05c9c">IG</span> = Instagram posts &middot; <span style="color:#e05c5c">YT</span> = YouTube videos &middot; flw = follower count &middot; subs = subscriber count<br>
      <span style="color:var(--muted);font-weight:700">ER%</span> = Engagement Rate &mdash; LI: (likes+comments+shares)&divide;(posts&times;followers)&times;100 &middot; X: (likes+replies+retweets)&divide;followers&times;100 &middot; IG: (likes+comments)&divide;followers&times;100 &middot; YT: (likes+comments)&divide;subscribers&times;100<br>
      SoV% = org total &divide; cohort total &middot; Data: LinkedIn API &middot; X API v2 &middot; Instagram Graph API &middot; YouTube Data API v3<br>
      <span style="color:var(--muted);font-weight:700">CELL VALUES</span> &middot; <span style="color:var(--text)">0</span> = fetch completed, verified no AQ posts &middot; &mdash; = no handle configured &middot; <span style="color:#e05c5c">&#10007;</span> = API request failed (hover for reason)
    </div>

    <!-- Per-org collapsible accordion cards (one per org, collapsed by default).
         DATA COVERAGE /10: LI data points (posts✓ + followers✓ + ER%✓ = 3) + X (3) + IG (posts✓ + followers✓ = 2) + YT (videos✓ + subs✓ = 2) = 10 max.

         Card header pattern:
         <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:12px">
           <div style="padding:14px 20px;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;background:var(--surface2)"
                onclick="var b=this.nextElementSibling;var a=this.querySelector('.soc-arr');if(b.style.display==='none'){b.style.display='block';a.textContent='▼'}else{b.style.display='none';a.textContent='▶'}">
             <span style="font-family:monospace;font-size:13px;color:var(--muted)">#{RANK}</span>
             <span style="font-family:monospace;font-weight:700;font-size:14px;color:{ORG_COLOR}">{ORG_NAME}</span>
             <span style="font-family:monospace;font-weight:700;font-size:13px;color:var(--amber)">{DATA_COVERAGE}/10</span>
             <span style="font-family:monospace;font-size:13px;margin-left:auto;display:flex;gap:14px;align-items:center">
               <span><span style="color:#5b8fd6">{LI_POSTS} LI</span> &middot; <span style="color:var(--text)">{X_POSTS} X</span> &middot; <span style="color:#e05c9c">{IG_POSTS} IG</span> &middot; <span style="color:#e05c5c">{YT_VIDEOS} YT</span></span>
               <span class="soc-arr" style="color:var(--amber);font-size:14px">▶</span>
             </span>
           </div>
           <div style="display:none">

             LINKEDIN section (color #5b8fd6):
             <div style="padding:18px 20px;border-top:1px solid var(--border)">
               <div style="font-family:monospace;font-size:12px;font-weight:700;letter-spacing:.8px;color:#5b8fd6;margin-bottom:16px">
                 LINKEDIN — {LI_POSTS} AQ POSTS · {LI_FLW} FOLLOWERS · ER {LI_ER}% · ♥ {LI_LIKES} · 💬 {LI_COMMENTS} · ↗ {LI_SHARES}
               </div>
               Per post:
               <div style="border-left:2px solid rgba(91,143,214,.4);padding:10px 14px;margin-bottom:12px;background:rgba(91,143,214,.04);border-radius:0 6px 6px 0">
                 <div style="font-size:15px;line-height:1.7;color:var(--text);margin-bottom:7px">
                   <a href="{POST_URL}" style="font-family:monospace;font-size:12px;color:#5b8fd6;margin-right:6px" target="_blank">[link]</a>
                   {POST_TEXT_FULL}
                 </div>
                 <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-bottom:8px">♥ {LIKES} · 💬 {COMMENTS} · ↗ {SHARES} · {DATE}</div>
                 <div style="display:flex;gap:6px;flex-wrap:wrap">
                   <span style="background:rgba(6,182,212,.09);border:1px solid rgba(6,182,212,.2);border-radius:3px;padding:2px 8px;font-family:monospace;font-size:12px;color:#06b6d4">{KEYWORD}</span>
                 </div>
               </div>
             </div>

             X/TWITTER section (color var(--text)/muted border):
             Header: X / TWITTER — {X_POSTS} AQ TWEETS · {X_FLW} FOLLOWERS · ER {X_ER}% · ♥ {X_LIKES} · 💬 {X_REPLIES} · ↺ {X_RETWEETS}
             Per tweet: same card pattern but border rgba(200,216,232,.25), bg rgba(200,216,232,.03), [link] color var(--muted2), chip color var(--muted2)
             Engagement line: ♥ {LIKES} · 💬 {REPLIES} · ↺ {RETWEETS} · 👁 {VIEWS} · {DATE}

             INSTAGRAM section (color #e05c9c):
             Header: INSTAGRAM — {IG_POSTS} AQ POSTS · {IG_FLW} FOLLOWERS · ER {IG_ER}%
             If 0 AQ posts: show a note box explaining how many total posts and why none were AQ-relevant.
             <div style="font-family:monospace;font-size:13px;color:var(--muted2);background:rgba(224,92,156,.05);border:1px solid rgba(224,92,156,.15);border-radius:6px;padding:10px 14px">
               {TOTAL_IG_POSTS} posts published in {MONTH} {YEAR}, none contained AQ keywords (...). Account is verified (✓).
             </div>

             YOUTUBE section (color #e05c5c):
             Header: YOUTUBE — {YT_VIDEOS} AQ VIDEOS · {YT_SUBS} SUBSCRIBERS · {YT_TOTAL} TOTAL VIDEOS
             If 0 videos: show a note box. Channel: {CHANNEL_NAME} ({CHANNEL_ID}).

           </div>
         </div>
    -->
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       SECTION 04 — LLM VISIBILITY / AEO
       ═══════════════════════════════════════════════════════════════ -->
  <section class="sec" id="aeo">
    <div class="sh">
      <div class="se">Section 04</div>
      <h2 class="st">LLM Visibility</h2>
      <div class="sd">How often each organisation is cited when AI tools answer air quality questions. AEO Score = min(mentions × 20, 100).</div>
      <div class="sdiv"></div>
    </div>
    <table class="at">
      <thead>
        <tr>
          <th>#</th><th>Organisation</th>
          <th>AI Mentions</th><th>AEO Score</th><th>Notable Citations</th>
        </tr>
      </thead>
      <tbody>
        <!-- COHORT row, then per-org sorted by AEO Score desc.

        COHORT row:
        <tr>
          <td colspan="2" style="font-family:monospace;font-weight:700;color:var(--amber)">COHORT TOTAL</td>
          <td style="font-family:monospace;font-weight:700;color:var(--amber)">{C_AI_MENTIONS}</td>
          <td style="font-family:monospace;font-weight:700;color:var(--amber)">{C_AEO}</td>
          <td>—</td>
        </tr>

        Per-org row:
        <tr>
          <td style="font-family:monospace;font-size:17px;color:var(--muted)">{RANK}</td>
          <td style="font-family:monospace;font-weight:700;color:{ORG_COLOR}">{ORG}</td>
          <td style="font-family:monospace;font-weight:700;color:var(--text)">{AI_MENTIONS}</td>
          <td style="font-family:monospace;font-weight:700;color:var(--text)">{AEO_SCORE}</td>
          <td style="font-size:16px;color:var(--muted2)">{CITATION_DESCRIPTION}</td>
        </tr>
        -->
      </tbody>
    </table>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       SECTION 05 — SCORECARD
       Section label: "Section 05" (full report) / "Section 04" (client — without exec/actions)
       ═══════════════════════════════════════════════════════════════ -->
  <section class="sec" id="score">
    <div class="sh">
      <div class="se">Section 05</div>
      <h2 class="st">Scorecard</h2>
      <div class="sd">Share of voice across Press, LLM, and Social. Each channel is normalised to its own cohort share so all three carry equal weight; the Overall SoV is their average, and orgs are ranked by it. Click any row to see the breakdown.</div>
      <div class="sdiv"></div>
    </div>

    <!-- Score cards — one set per client org (or for the primary org in a multi-org report).
         Sub-line shows component breakdown per channel. -->
    <div class="scc">
      <div class="sca">
        <div class="scn" style="color:var(--muted2)">Social Score</div>
        <div class="scg" style="color:var(--text)">{SOCIAL_SCORE}</div>
        <div style="font-family:monospace;font-size:14px;color:var(--muted);margin-top:4px">
          <span style="color:#5b8fd6">LI {LI_COMP}</span> · <span style="color:var(--text)">X {X_COMP}</span> · <span style="color:#e05c9c">IG {IG_COMP}</span> · <span style="color:#e05c5c">YT {YT_COMP}</span>
        </div>
      </div>
      <div class="sca">
        <div class="scn" style="color:var(--muted2)">Media Score</div>
        <div class="scg" style="color:var(--text)">{MEDIA_SCORE}</div>
        <div style="font-family:monospace;font-size:14px;color:var(--muted);margin-top:4px">{ONLINE} online · {PRINT} print · {TV} TV</div>
      </div>
      <div class="sca">
        <div class="scn" style="color:var(--muted2)">AEO Score</div>
        <div class="scg" style="color:var(--text)">{AEO_SCORE}</div>
        <div style="font-family:monospace;font-size:14px;color:var(--muted);margin-top:4px">{AI_MENTIONS} AI citations</div>
      </div>
      <div class="sca" style="border-color:var(--amber)">
        <div class="scn" style="color:var(--amber)">Overall Score</div>
        <div class="scg" style="color:var(--amber)">{OVERALL_SCORE}</div>
        <div style="font-family:monospace;font-size:14px;color:var(--muted);margin-top:4px">SoV: {SOV_PCT}%</div>
      </div>
    </div>

    <!-- Full ranking table — class "nt" (no-hover-background alternate style).
         Columns: RANK | ORGANISATION | PRESS SOV | LLM SOV | SOCIAL SOV | OVERALL SOV
         Org rows are clickable — onclick toggles the breakdown row below.
         Breakdown row id must be "{ORG_ID}-bd-{SECTION_NUM}" to avoid collision between full/client reports. -->
    <table class="nt">
      <thead>
        <tr>
          <th style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted)">RANK</th>
          <th style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted)">ORGANISATION</th>
          <th style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted)">PRESS SOV</th>
          <th style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted)">LLM SOV</th>
          <th style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted)">SOCIAL SOV</th>
          <th style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--amber)">OVERALL SOV</th>
        </tr>
      </thead>
      <tbody>
        <!-- Per-org rows sorted by Overall SoV desc (alphabetical tiebreak). NO COHORT TOTAL ROW here — it's trivially 100% for all columns.
             Note for single-org report: add a note below the table explaining SoV% = 100% because there is only one org in the cohort.
             Show raw values (e.g. "1 article", "2 mentions", "{SOCIAL_SCORE}/100") as sub-lines under the SOV%.

        Org row (clickable — toggles breakdown):
        <tr style="cursor:pointer" onclick="var b=document.getElementById('{ORG_ID}-bd-05');b.style.display=b.style.display==='none'?'table-row':'none'">
          <td style="font-family:monospace;font-size:17px;color:var(--muted)">{RANK}</td>
          <td style="font-family:monospace;font-weight:700;color:{ORG_COLOR}">{ORG_NAME}</td>
          <td>
            <div style="font-family:monospace;font-weight:700;font-size:18px;color:var(--good)">{PRESS_SOV}%</div>
            <div style="font-family:monospace;font-size:13px;color:var(--muted2)">{ONLINE_COUNT} online · {PRINT_COUNT} print · {TV_COUNT} TV</div>
          </td>
          <td>
            <div style="font-family:monospace;font-weight:700;font-size:18px;color:var(--good)">{LLM_SOV}%</div>
            <div style="font-family:monospace;font-size:13px;color:var(--muted2)">{AI_MENTIONS} AI citations</div>
          </td>
          <td>
            <div style="font-family:monospace;font-weight:700;font-size:18px;color:var(--good)">{SOCIAL_SOV}%</div>
            <div style="font-family:monospace;font-size:13px;color:var(--muted2)">{SOCIAL_SCORE}/100 · {DATA_COVERAGE}/10 data</div>
          </td>
          <td>
            <div style="font-family:'DM Serif Display',serif;font-size:26px;font-weight:400;color:var(--amber)">{OVERALL_SOV}%</div>
          </td>
        </tr>

        Breakdown row (hidden by default — toggled by clicking org row above):
        <tr id="{ORG_ID}-bd-05" style="display:none">
          <td colspan="6" style="padding:0">
            <div style="background:rgba(201,146,42,.06);border-top:1px solid rgba(201,146,42,.2);border-bottom:1px solid rgba(201,146,42,.2);padding:20px 24px">
              <div style="font-family:monospace;font-size:14px;color:var(--amber);font-weight:700;margin-bottom:16px">
                ({PRESS_SOV}% + {LLM_SOV}% + {SOCIAL_SOV}%) &divide; 3 = {OVERALL_SOV}%
              </div>
              <div style="display:flex;gap:14px;flex-wrap:wrap">
                <div style="flex:1;min-width:160px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px 16px">
                  <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted);margin-bottom:8px">PRESS</div>
                  <div style="font-family:monospace;font-size:22px;font-weight:700;color:var(--good)">{PRESS_SOV}%</div>
                  <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-top:4px">{ONLINE_COUNT} online · {PRINT_COUNT} print · {TV_COUNT} TV &rarr; {MEDIA_SCORE} pts</div>
                </div>
                <div style="flex:1;min-width:160px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px 16px">
                  <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted);margin-bottom:8px">LLM</div>
                  <div style="font-family:monospace;font-size:22px;font-weight:700;color:var(--good)">{LLM_SOV}%</div>
                  <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-top:4px">{AI_MENTIONS} AI citations &rarr; {AEO_SCORE} pts</div>
                </div>
                <div style="flex:1;min-width:160px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px 16px">
                  <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--muted);margin-bottom:8px">SOCIAL</div>
                  <div style="font-family:monospace;font-size:22px;font-weight:700;color:var(--good)">{SOCIAL_SOV}%</div>
                  <div style="font-family:monospace;font-size:13px;color:var(--muted2);margin-top:4px">{SOCIAL_SCORE}/100 pts · {DATA_COVERAGE}/10 data coverage</div>
                </div>
              </div>
            </div>
          </td>
        </tr>
        -->
      </tbody>
    </table>
    <div class="scf"><strong>Formula:</strong> Overall SoV = (PRESS SoV + LLM SoV + SOCIAL SoV) &divide; 3 &nbsp;&middot;&nbsp; Each channel SoV = org_channel_score &divide; cohort_channel_total × 100 &nbsp;&middot;&nbsp; Single-org cohort: all SoV = 100% by definition</div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       SECTION 06 — ACTION MATRIX
       INTERNAL ONLY — remove this entire <section> block plus its
       sidenav/mob-nav <a> links for the client version
       ═══════════════════════════════════════════════════════════════ -->
  <section class="sec" id="actions">
    <div class="sh">
      <div class="se">Section 06</div>
      <h2 class="st">Action Matrix</h2>
      <div class="sd">Priority recommendations anchored to data. <span class="pri-fix">FIX</span> critical gap · <span class="pri-lev">LEVERAGE</span> strength · <span class="pri-opt">OPPORTUNITY</span> growth · <span class="pri-inv">INVEST</span> capability build.</div>
      <div class="sdiv"></div>
    </div>
    <!-- Action card template — repeat numbered 1, 2, 3…
    <div class="fc">
      <div class="fn">1</div>
      <div class="fb">
        <div class="fh"><span class="pri-fix">FIX</span> &nbsp;{Action headline — short, imperative}</div>
        <div class="fd">{Specific recommendation with data evidence. Anchor every claim to a number.
             Example: "3 AQ LinkedIn posts in August averaged 72 engagements each — publish 2× per week in
             September to capitalise on Clean Air Horizons momentum before the event date."}</div>
      </div>
    </div>
    -->
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       SECTION 07 — EMERGING NARRATIVES
       ═══════════════════════════════════════════════════════════════ -->
  <section class="sec" id="em">
    <div class="sh">
      <div class="se">Section 07</div>
      <h2 class="st">Emerging Narratives</h2>
      <div class="sd">AQ topics gaining media traction that tracked organisations have not covered — narrative opportunities.</div>
      <div class="sdiv"></div>
    </div>
    <!-- Emerging narrative card template — repeat per topic.
    <div class="em-card">
      <div class="em-hdr">
        <div class="em-topic">{Topic name}</div>
        <div class="em-mom">RISING</div>
      </div>
      <div class="em-body">{Why this topic is gaining traction and what the opportunity is for the org to own it.}</div>
    </div>
    -->
  </section>

  <div class="rf">
    Emerald AI · Confidential · Prepared for {CLIENT_NAME} · {DATE_FROM} to {DATE_TO} · Generated {GENERATED_DATE}
  </div>

</main>
</div>

<script>
function toggleEdit(){
  var b=document.body,btn=document.getElementById('edit-btn');
  var on=b.classList.toggle('edit-mode');
  btn.classList.toggle('on',on);
  btn.textContent=on?'✓ Editing':'✎ Edit Mode';
  document.querySelectorAll('.st,.sd,.fh,.fd,.em-topic,.em-body,[contenteditable]').forEach(function(el){
    el.contentEditable=on?'true':'false';
  });
}
function dlEdit(){
  var a=document.createElement('a');
  a.href='data:text/html;charset=utf-8,'+encodeURIComponent('<!DOCTYPE html>'+document.documentElement.outerHTML);
  a.download='emerald-report-edited.html';a.click();
}
(function(){
  var secs=document.querySelectorAll('.sec[id]');
  var navAs=document.querySelectorAll('.nav-a');
  if(!secs.length||!navAs.length)return;
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        navAs.forEach(function(a){
          a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id);
        });
      }
    });
  },{rootMargin:'-20% 0px -70% 0px'});
  secs.forEach(function(s){obs.observe(s);});
})();
</script>
</body>
</html>
```

### Template notes

- **{CLIENT_NAME}**: org or client name from STEP 0. Used in the `<title>`, `.rt` header, and footer.
- **{DATE_FROM}** / **{DATE_TO}**: ISO dates (YYYY-MM-DD) from STEP 0.
- **{GENERATED_DATE}**: today's date in YYYY-MM-DD format.
- **{ORG_COLOR}**: assign one colour per org from this palette (in order):
  `#c9922a` `#06b6d4` `#84cc16` `#f97316` `#8b5cf6` `#e05c5c` `#3d8ef0` `#4caf74` `#ec4899` `#a371f7` `#e05c3a` `#14b8a6` `#ef4444`
- **Executive Summary** (`#exec`) and **Action Matrix** (`#actions`) are marked **INTERNAL ONLY**. For the client HTML, remove both `<section>` blocks and remove their `<a>` links from the `<nav class="sidenav">` and `<nav class="mob-nav">`.
- **Collapsible exec summary**: starts open. Clicking the header row toggles it.
- **SENTINEL note**: include the green verified box in every exec summary. All numbers in the exec summary prose must match the tables exactly.
- **Score cards** (`.scc`): show Social + Media + AEO + Overall in the card grid before the ranking table.
- **Priority badges**: `pri-fix` = amber/warn · `pri-lev` = green/good · `pri-opt` = blue · `pri-inv` = red/bad.
- **COHORT rows**: bold amber, appear in every table (press, social, AEO, scorecard).
- **Single-org reports**: SoV% = 100% by definition — add a short note below the scorecard table.

---

## STEP 4 — SAVE

Use the **Write tool** to save two files:

1. `outputs/emerald-{orgs_slug}-{DATE_FROM}-to-{DATE_TO}.html` — full report
2. `outputs/emerald-{orgs_slug}-{DATE_FROM}-to-{DATE_TO}-client.html` — same HTML with `#exec` and `#actions` sections removed, and their nav links removed

The `outputs/` folder is relative to the working directory.

---

## QUALITY RULES

- Every number must come from a real tool result. No estimating.
- API failures → show `0` (not ✕) with a red tooltip showing the failure reason.
- Missing handle after search → `—` (counts as 0 in scoring). Ask user for handle if critical.
- Tied SoV% → alphabetical tiebreak.
- Terminology: "Emerging Narratives" — never "White-Space Gaps".
- COHORT rows appear in every table.
- Do NOT process orgs not named by the user.
