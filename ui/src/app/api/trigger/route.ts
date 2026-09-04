import { NextRequest, NextResponse } from "next/server";

const OWNER  = "ArjunTewari";
const REPO   = "emerald-mcp";
const WORKFLOW = "generate-report.yml";

export async function POST(req: NextRequest) {
  const { orgs, date_from, date_to, client } = await req.json();

  if (!orgs || !date_from || !date_to) {
    return NextResponse.json({ error: "orgs, date_from, date_to required" }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "master",
        inputs: { orgs, date_from, date_to, client: client || "Client" },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `GitHub API error: ${text}` }, { status: 500 });
  }

  // GitHub returns 204 — fetch the run id from the runs list (slight delay needed)
  await new Promise(r => setTimeout(r, 3000));

  const runsRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  const runsData = await runsRes.json();
  const run_id = runsData.workflow_runs?.[0]?.id;

  return NextResponse.json({ run_id });
}
