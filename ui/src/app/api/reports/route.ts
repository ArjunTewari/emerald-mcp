import { NextResponse } from "next/server";

const OWNER = "ArjunTewari";
const REPO  = "emerald-mcp";

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/reports`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 30 },
    }
  );

  if (res.status === 404) {
    return NextResponse.json({ reports: [] });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to list reports" }, { status: 500 });
  }

  const files = await res.json();
  const reports = (Array.isArray(files) ? files : [])
    .filter((f: { name: string }) => f.name.endsWith(".html"))
    .map((f: { name: string; size: number; download_url: string; sha: string }) => ({
      name:         f.name,
      size_kb:      Math.round(f.size / 1024),
      download_url: f.download_url,
    }))
    .reverse();

  return NextResponse.json({ reports });
}
