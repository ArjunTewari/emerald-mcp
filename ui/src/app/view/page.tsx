"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Viewer() {
  const params = useSearchParams();
  const url = params.get("url");
  const [html, setHtml]   = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!url) { setError("No report URL provided"); return; }
    fetch(url)
      .then(r => r.text())
      .then(setHtml)
      .catch(() => setError("Failed to load report"));
  }, [url]);

  if (error) return (
    <div style={{ padding: 40, color: "var(--red)" }}>
      {error} — <a href="/reports">Back to reports</a>
    </div>
  );

  if (!html) return (
    <div style={{ padding: 40, color: "var(--muted)" }}>Loading report…</div>
  );

  return (
    <>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        background: "rgba(15,25,35,0.95)", borderBottom: "1px solid var(--border)",
        padding: "8px 20px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <a href="/reports" style={{ color: "var(--emerald)", fontSize: 13 }}>← Reports</a>
        <a href="/" style={{ color: "var(--muted)", fontSize: 13 }}>+ New</a>
      </div>
      <div
        style={{ paddingTop: 40 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}

export default function ViewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--muted)" }}>Loading…</div>}>
      <Viewer />
    </Suspense>
  );
}
