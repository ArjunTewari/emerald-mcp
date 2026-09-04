import { NextRequest, NextResponse } from "next/server";

const OWNER = "ArjunTewari";
const REPO  = "emerald-mcp";
const PATH  = "org-handles.json";
const BRANCH = "master";

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`,
    { headers: ghHeaders(token) }
  );
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch org-handles.json" }, { status: 500 });

  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return NextResponse.json({ handles: JSON.parse(content), sha: data.sha });
}

export async function PUT(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });

  const { handles, sha } = await req.json();
  if (!handles || !sha) return NextResponse.json({ error: "handles and sha required" }, { status: 400 });

  const content = Buffer.from(JSON.stringify(handles, null, 2) + "\n").toString("base64");

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,
    {
      method: "PUT",
      headers: ghHeaders(token),
      body: JSON.stringify({
        message: "chore(handles): update org social handles via UI",
        content,
        sha,
        branch: BRANCH,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `GitHub API error: ${text}` }, { status: 500 });
  }

  const result = await res.json();
  return NextResponse.json({ sha: result.content.sha });
}
