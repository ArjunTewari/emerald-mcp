"use client";
import { useEffect, useState } from "react";

type Report = { name: string; size_kb: number; download_url: string };

function parseName(name: string) {
  // emerald-CEEW-WRI-India-2026-08-01-to-2026-08-31.html
  const without = name.replace(/^emerald-/, "").replace(/\.html$/, "");
  const match = without.match(/^(.+?)-(\d{4}-\d{2}-\d{2})-to-(\d{4}-\d{2}-\d{2})$/);
  if (match) {
    return { orgs: match[1].replace(/-/g, " "), from: match[2], to: match[3] };
  }
  return { orgs: without, from: "", to: "" };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => { setReports(d.reports ?? []); setLoading(false); })
      .catch(() => { setError("Failed to load reports"); setLoading(false); });
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--emerald)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Emerald AI
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--white)" }}>Reports</h1>
        </div>
        <a href="/" style={{ background: "var(--emerald2)", color: "#0a1520", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 14 }}>
          + New Report
        </a>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}
      {error   && <p style={{ color: "var(--red)" }}>{error}</p>}

      {!loading && !error && reports.length === 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--muted)" }}>No reports yet. Generate your first one.</p>
          <a href="/" style={{ display: "inline-block", marginTop: 16, color: "var(--emerald)" }}>Generate →</a>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reports.map(r => {
          const { orgs, from, to } = parseName(r.name);
          return (
            <div key={r.name} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "16px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            }}>
              <div>
                <div style={{ color: "var(--white)", fontWeight: 600, marginBottom: 4 }}>{orgs}</div>
                {from && (
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{from} → {to} · {r.size_kb} KB</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <a
                  href={`/view?url=${encodeURIComponent(r.download_url)}`}
                  style={{ background: "var(--emerald2)", color: "#0a1520", borderRadius: 6, padding: "7px 14px", fontWeight: 600, fontSize: 13 }}
                >
                  View
                </a>
                <a
                  href={r.download_url}
                  download={r.name}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 6, padding: "7px 14px", fontSize: 13 }}
                >
                  Download
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
