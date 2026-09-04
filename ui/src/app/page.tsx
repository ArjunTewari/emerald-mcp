"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const KNOWN_ORGS = [
  "WRI India",
  "Air Pollution Action Group",
  "Chintan Environmental Research and Action Group",
  "IIT Kanpur",
  "CSTEP",
  "IIT Delhi",
  "Health Effects Institute",
  "ICCT",
  "EPIC India",
  "Council on Energy, Environment and Water",
  "Centre for Science and Environment",
  "Climate Trends",
  "Sustainable Futures Collaborative",
  "EnviroCatalysts",
  "Raahgiri Foundation",
  "TERI",
];

export default function Home() {
  const router = useRouter();
  const [orgs, setOrgs]       = useState<string[]>([]);
  const [orgInput, setOrgInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [client, setClient]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  function addOrg(name: string) {
    const trimmed = name.trim();
    if (trimmed && !orgs.includes(trimmed)) setOrgs([...orgs, trimmed]);
    setOrgInput("");
  }

  function removeOrg(name: string) {
    setOrgs(orgs.filter(o => o !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgs.length) { setError("Add at least one organisation."); return; }
    if (!dateFrom || !dateTo) { setError("Date range required."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgs: orgs.join(", "), date_from: dateFrom, date_to: dateTo, client }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to trigger report");
      router.push(`/status/${data.run_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--emerald)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          Emerald AI
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--white)" }}>
          Generate Report
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Competitive intelligence for Indian air quality organisations.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Orgs */}
        <div>
          <label style={labelStyle}>Organisations</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {orgs.map(o => (
              <span key={o} style={chipStyle}>
                {o}
                <button type="button" onClick={() => removeOrg(o)} style={chipRemoveStyle}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              list="org-list"
              value={orgInput}
              onChange={e => setOrgInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOrg(orgInput); } }}
              placeholder="Type org name and press Enter"
              style={inputStyle}
            />
            <datalist id="org-list">
              {KNOWN_ORGS.map(o => <option key={o} value={o} />)}
            </datalist>
            <button type="button" onClick={() => addOrg(orgInput)} style={secondaryBtnStyle}>Add</button>
          </div>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {KNOWN_ORGS.filter(o => !orgs.includes(o)).map(o => (
              <button key={o} type="button" onClick={() => addOrg(o)} style={quickAddStyle}>+ {o}</button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} required />
          </div>
        </div>

        {/* Client */}
        <div>
          <label style={labelStyle}>Client name <span style={{ color: "var(--muted)" }}>(optional)</span></label>
          <input
            type="text"
            value={client}
            onChange={e => setClient(e.target.value)}
            placeholder="e.g. Prakriti Foundation"
            style={inputStyle}
          />
        </div>

        {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}

        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? "Triggering…" : "Generate Report →"}
        </button>
      </form>

      <div style={{ marginTop: 32, textAlign: "center", display: "flex", gap: 24, justifyContent: "center" }}>
        <a href="/reports" style={{ color: "var(--muted)", fontSize: 13 }}>View past reports</a>
        <a href="/handles" style={{ color: "var(--muted)", fontSize: 13 }}>Manage org handles</a>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: "var(--muted)",
  textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600,
};
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "10px 14px", color: "var(--white)", fontSize: 14,
  outline: "none",
};
const chipStyle: React.CSSProperties = {
  background: "rgba(126,207,179,0.15)", border: "1px solid var(--emerald2)",
  borderRadius: 20, padding: "4px 12px", color: "var(--emerald)", fontSize: 13,
  display: "flex", alignItems: "center", gap: 6,
};
const chipRemoveStyle: React.CSSProperties = {
  background: "none", border: "none", color: "var(--emerald)", cursor: "pointer",
  fontSize: 16, lineHeight: 1, padding: 0,
};
const primaryBtnStyle: React.CSSProperties = {
  background: "var(--emerald2)", color: "#0a1520", border: "none", borderRadius: 8,
  padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer",
};
const secondaryBtnStyle: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
  padding: "10px 16px", color: "var(--text)", fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
};
const quickAddStyle: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20,
  padding: "3px 10px", color: "var(--muted)", fontSize: 12, cursor: "pointer",
};
