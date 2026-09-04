"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type RunStatus = {
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | null;
  html_url: string;
  created_at: string;
  updated_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  queued:      "Queued",
  in_progress: "Generating…",
  completed:   "Done",
};

const STEPS = [
  "Installing Claude Code CLI",
  "Writing config",
  "Collecting social media data",
  "Searching news coverage",
  "Running AEO questions",
  "Scoring and ranking",
  "Building HTML report",
  "Saving and committing",
];

export default function StatusPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<RunStatus | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/status?run_id=${runId}`);
        const data: RunStatus = await res.json();
        if (!cancelled) setRun(data);
        if (data.status !== "completed" && !cancelled) {
          setTimeout(poll, 8000);
        }
      } catch {
        if (!cancelled) setError("Failed to fetch status");
      }
    }
    poll();

    // Animate fake steps while in progress
    const stepTimer = setInterval(() => {
      setStep(s => (s < STEPS.length - 1 ? s + 1 : s));
    }, 18000);

    return () => { cancelled = true; clearInterval(stepTimer); };
  }, [runId]);

  const isSuccess = run?.status === "completed" && run?.conclusion === "success";
  const isFailed  = run?.status === "completed" && run?.conclusion !== "success";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ fontSize: 11, color: "var(--emerald)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        Emerald AI
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--white)", marginBottom: 32 }}>
        {run ? STATUS_LABELS[run.status] ?? run.status : "Starting…"}
      </h1>

      {/* Step list */}
      {!isSuccess && !isFailed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < step ? "rgba(126,207,179,0.2)" : i === step ? "var(--emerald2)" : "var(--surface)",
                color: i < step ? "var(--emerald)" : i === step ? "#0a1520" : "var(--muted)",
                border: `1px solid ${i <= step ? "var(--emerald2)" : "var(--border)"}`,
                flexShrink: 0,
              }}>
                {i < step ? "✓" : i + 1}
              </span>
              <span style={{ color: i === step ? "var(--white)" : i < step ? "var(--emerald)" : "var(--muted)", fontSize: 14 }}>
                {s}
                {i === step && <span style={{ marginLeft: 6, animation: "pulse 1.5s infinite", opacity: 0.7 }}>…</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {isSuccess && (
        <div>
          <div style={{ background: "rgba(76,175,116,0.12)", border: "1px solid var(--green)", borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <div style={{ color: "var(--green)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>✓ Report generated</div>
            <div style={{ color: "var(--text)", fontSize: 13 }}>The report has been committed to the repository.</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="/reports" style={{ ...btnStyle, background: "var(--emerald2)", color: "#0a1520" }}>View Reports →</a>
            <a href={run.html_url} target="_blank" rel="noreferrer" style={{ ...btnStyle, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              GitHub Run ↗
            </a>
          </div>
        </div>
      )}

      {isFailed && (
        <div>
          <div style={{ background: "rgba(224,92,92,0.1)", border: "1px solid var(--red)", borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <div style={{ color: "var(--red)", fontWeight: 700, marginBottom: 6 }}>Run failed</div>
            <div style={{ color: "var(--text)", fontSize: 13 }}>Check the GitHub Actions log for details.</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="/" style={{ ...btnStyle, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>← Try again</a>
            <a href={run?.html_url} target="_blank" rel="noreferrer" style={{ ...btnStyle, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              GitHub Log ↗
            </a>
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--red)", marginTop: 16 }}>{error}</p>}

      {run && (
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 32 }}>
          Run ID: {runId} · Started: {new Date(run.created_at).toLocaleTimeString()}
        </p>
      )}

      <div style={{ marginTop: 12 }}>
        <a href="/" style={{ color: "var(--muted)", fontSize: 13 }}>← Back</a>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "inline-block", padding: "10px 20px", borderRadius: 8,
  fontWeight: 600, fontSize: 14, textDecoration: "none",
};
