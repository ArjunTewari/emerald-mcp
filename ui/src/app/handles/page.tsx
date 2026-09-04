"use client";
import { useEffect, useState, useCallback } from "react";

type Handle = { linkedin: string; twitter: string; instagram: string; youtube: string };
type HandleMap = Record<string, Handle>;

const EMPTY_HANDLE: Handle = { linkedin: "", twitter: "", instagram: "", youtube: "" };

const PLATFORMS = [
  { key: "linkedin",  label: "LinkedIn",  placeholder: "company-slug" },
  { key: "twitter",   label: "X / Twitter", placeholder: "@handle (no @)" },
  { key: "instagram", label: "Instagram", placeholder: "username" },
  { key: "youtube",   label: "YouTube",   placeholder: "Channel ID or handle" },
] as const;

export default function HandlesPage() {
  const [handles, setHandles]   = useState<HandleMap>({});
  const [sha, setSha]           = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [saved, setSaved]       = useState(false);
  const [editing, setEditing]   = useState<string | null>(null);
  const [editBuf, setEditBuf]   = useState<Handle>(EMPTY_HANDLE);
  const [addMode, setAddMode]   = useState(false);
  const [newOrg, setNewOrg]     = useState("");
  const [newHandle, setNewHandle] = useState<Handle>(EMPTY_HANDLE);
  const [search, setSearch]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/handles");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to load");
      setHandles(d.handles); setSha(d.sha);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(updated: HandleMap) {
    setSaving(true); setError(""); setSaved(false);
    try {
      const r = await fetch("/api/handles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: updated, sha }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Save failed");
      setSha(d.sha); setHandles(updated); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(org: string) {
    setEditing(org);
    setEditBuf({ ...EMPTY_HANDLE, ...handles[org] });
    setAddMode(false);
  }

  function cancelEdit() { setEditing(null); }

  function commitEdit() {
    if (!editing) return;
    const updated = { ...handles, [editing]: editBuf };
    setEditing(null);
    save(updated);
  }

  function removeOrg(org: string) {
    if (!confirm(`Remove "${org}"?`)) return;
    const updated = { ...handles };
    delete updated[org];
    save(updated);
  }

  function startAdd() {
    setAddMode(true); setNewOrg(""); setNewHandle({ ...EMPTY_HANDLE });
    setEditing(null);
  }

  function commitAdd() {
    const name = newOrg.trim();
    if (!name) return;
    const updated = { ...handles, [name]: newHandle };
    setAddMode(false);
    save(updated);
  }

  const orgs = Object.keys(handles).filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--emerald)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Emerald AI</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--white)" }}>Org Handles</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Social media handles for all tracked organisations. Edits commit directly to GitHub.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/" style={secondaryBtn}>← Generate</a>
          <a href="/reports" style={secondaryBtn}>Reports</a>
          <button onClick={startAdd} style={primaryBtn}>+ Add Org</button>
        </div>
      </div>

      {/* Status bar */}
      {saved  && <div style={bannerStyle("var(--green)")}>✓ Saved and committed to GitHub</div>}
      {error  && <div style={bannerStyle("var(--red)")}>{error}</div>}
      {saving && <div style={bannerStyle("var(--amber)")}>Saving to GitHub…</div>}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter orgs…"
        style={{ ...inputStyle, marginBottom: 20, maxWidth: 320 }}
      />

      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {/* Add form */}
      {addMode && (
        <div style={cardStyle("#c9922a")}>
          <div style={{ fontWeight: 700, color: "var(--amber)", marginBottom: 14 }}>New Organisation</div>
          <input
            value={newOrg}
            onChange={e => setNewOrg(e.target.value)}
            placeholder="Organisation name (exact)"
            style={{ ...inputStyle, marginBottom: 12 }}
            autoFocus
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
            {PLATFORMS.map(p => (
              <div key={p.key}>
                <label style={labelStyle}>{p.label}</label>
                <input
                  value={newHandle[p.key]}
                  onChange={e => setNewHandle(h => ({ ...h, [p.key]: e.target.value }))}
                  placeholder={p.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={commitAdd} disabled={!newOrg.trim() || saving} style={primaryBtn}>Save</button>
            <button onClick={() => setAddMode(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orgs.length === 0 && <p style={{ color: "var(--muted)" }}>No orgs match.</p>}
          {orgs.map(org => (
            <div key={org} style={{ background: "var(--surface)", border: `1px solid ${editing === org ? "var(--emerald2)" : "var(--border)"}`, borderRadius: 10, overflow: "hidden" }}>
              {editing === org ? (
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ fontWeight: 700, color: "var(--white)", marginBottom: 12 }}>{org}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
                    {PLATFORMS.map(p => (
                      <div key={p.key}>
                        <label style={labelStyle}>{p.label}</label>
                        <input
                          value={editBuf[p.key]}
                          onChange={e => setEditBuf(b => ({ ...b, [p.key]: e.target.value }))}
                          placeholder={p.placeholder}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button onClick={commitEdit} disabled={saving} style={primaryBtn}>Save</button>
                    <button onClick={cancelEdit} style={secondaryBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: "0 0 220px", fontWeight: 600, color: "var(--white)", fontSize: 14 }}>{org}</div>
                  <div style={{ flex: 1, display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {PLATFORMS.map(p => {
                      const val = handles[org]?.[p.key];
                      return (
                        <div key={p.key} style={{ minWidth: 120 }}>
                          <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>{p.label}</div>
                          <div style={{ fontSize: 13, color: val ? "var(--text)" : "var(--muted)", marginTop: 2 }}>{val || "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => startEdit(org)} style={iconBtn}>Edit</button>
                    <button onClick={() => removeOrg(org)} style={{ ...iconBtn, color: "var(--red)" }}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 24 }}>
        {Object.keys(handles).length} orgs configured · Changes commit to <code>org-handles.json</code> on GitHub
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#0f1923", border: "1px solid var(--border)",
  borderRadius: 6, padding: "8px 12px", color: "var(--white)", fontSize: 13, outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, color: "var(--muted)", textTransform: "uppercase",
  letterSpacing: 1, marginBottom: 4, fontWeight: 600,
};
const primaryBtn: React.CSSProperties = {
  background: "var(--emerald2)", color: "#0a1520", border: "none", borderRadius: 6,
  padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "8px 14px", color: "var(--text)", fontSize: 13, cursor: "pointer",
  textDecoration: "none", display: "inline-block",
};
const iconBtn: React.CSSProperties = {
  background: "none", border: "1px solid var(--border)", borderRadius: 6,
  padding: "5px 12px", color: "var(--muted)", fontSize: 12, cursor: "pointer",
};
function cardStyle(borderColor: string): React.CSSProperties {
  return {
    background: "var(--surface)", border: `1px solid ${borderColor}40`,
    borderLeft: `3px solid ${borderColor}`, borderRadius: 10,
    padding: "20px", marginBottom: 16,
  };
}
function bannerStyle(color: string): React.CSSProperties {
  return {
    background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8,
    padding: "10px 16px", marginBottom: 16, fontSize: 13, color,
  };
}
