import { NextRequest, NextResponse } from "next/server";

const OWNER = "ArjunTewari";
const REPO  = "emerald-mcp";

export async function GET(req: NextRequest) {
  const run_id = req.nextUrl.searchParams.get("run_id");
  if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${run_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch run status" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({
    status:     data.status,      // queued | in_progress | completed
    conclusion: data.conclusion,  // success | failure | null
    name:       data.name,
    html_url:   data.html_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
  });
}
