import { useState, useEffect } from "react";

const STAGES = [
  "classify_documents",
  "extract_facts",
  "synthesize",
  "examine",
  "human_review_gate",
  "commit",
];

const LOADING_STEPS = [
  "📄 Ingesting document file & extracting raw text...",
  "🧩 Splitting text into character spans & generating vector embeddings...",
  "🔍 Classifying document type with Groq LLM (classify_documents)...",
  "⚡ Extracting atomic facts & payment terms (extract_facts)...",
  "⚖️ Synthesizing section versions & checking conflicts (synthesize)...",
  "🛡️ Running compliance audit checks (examine)...",
  "🚦 Preparing Human Review Gate (human_review_gate)...",
];

export default function App() {
  const [mode, setMode] = useState("file"); // "file" | "text"
  const [pileName, setPileName] = useState("Vendor Contract Pile");
  const [selectedFile, setSelectedFile] = useState(null);
  const [docText, setDocText] = useState(
    "MASTER SERVICES AGREEMENT\n\nPayment terms: Net 30 days.\nPenalty rate: 1.5% per month on overdue invoices.\nTermination notice: 60 days written notice required."
  );
  const [runId, setRunId] = useState("");
  const [runStatus, setRunStatus] = useState(null);
  const [pending, setPending] = useState({ findings: [], conflicts: [] });
  const [costs, setCosts] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1100);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const API_BASE = "http://localhost:8000";

  async function fetchRunData(id) {
    if (!id) return;
    setLoading(true);
    try {
      const resStatus = await fetch(`${API_BASE}/runs/${id}/status`);
      if (resStatus.ok) {
        setRunStatus(await resStatus.json());
      } else {
        setRunStatus(null);
        setMessage(`Run '${id}' not found. Enter a valid Run ID or upload a new document.`);
        return;
      }

      const resPending = await fetch(`${API_BASE}/runs/${id}/pending-reviews`);
      if (resPending.ok) {
        setPending(await resPending.json());
      }

      const resCost = await fetch(`${API_BASE}/runs/${id}/cost`);
      if (resCost.ok) {
        setCosts(await resCost.json());
      }
    } catch (err) {
      setMessage(`Error fetching run data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (runId && runId.length === 36) {
      fetchRunData(runId);
    }
  }, [runId]);

  async function handleUploadAndRun() {
    setLoading(true);
    setMessage("");
    try {
      // 1. Create Pile
      const resPile = await fetch(`${API_BASE}/piles?name=${encodeURIComponent(pileName)}&domain=vendor_contracts`, {
        method: "POST",
      });
      if (!resPile.ok) {
        const errorText = await resPile.text();
        throw new Error(`Failed to create pile: ${errorText}`);
      }
      const pileData = await resPile.json();
      const newPileId = pileData.pile_id;

      // 2. Upload Document
      if (mode === "file") {
        if (!selectedFile) {
          setMessage("Please select a file to upload.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);

        const resDoc = await fetch(`${API_BASE}/piles/${newPileId}/documents/upload`, {
          method: "POST",
          body: formData,
        });
        if (!resDoc.ok) {
          throw new Error("File upload failed");
        }
      } else {
        if (!docText.trim()) {
          setMessage("Please enter document text.");
          setLoading(false);
          return;
        }
        await fetch(`${API_BASE}/piles/${newPileId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_path: "pasted_contract.txt",
            raw_text: docText,
          }),
        });
      }

      // 3. Start Full Ingest Run
      const resRun = await fetch(`${API_BASE}/piles/${newPileId}/runs?run_type=full_ingest`, {
        method: "POST",
      });
      const runData = await resRun.json();
      setRunId(runData.run_id);
      setMessage(`Document processed! Run started: ${runData.run_id}`);
    } catch (err) {
      setMessage(`Upload & run failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(itemId) {
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}/reviews/${itemId}/approve`, { method: "POST" });
      if (res.ok) {
        setMessage(`Approved review item ${itemId}`);
        fetchRunData(runId);
      }
    } catch (err) {
      setMessage(`Approve failed: ${err.message}`);
    }
  }

  async function handleReject(itemId) {
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}/reviews/${itemId}/reject`, { method: "POST" });
      if (res.ok) {
        setMessage(`Rejected review item ${itemId}`);
        fetchRunData(runId);
      }
    } catch (err) {
      setMessage(`Reject failed: ${err.message}`);
    }
  }

  async function handleFinalize() {
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}/reviews/finalize`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Batch finalized! Run status: ${data.status}`);
        fetchRunData(runId);
      } else {
        setMessage(`Finalize failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      setMessage(`Finalize failed: ${err.message}`);
    }
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 32, maxWidth: 1000, margin: "0 auto", color: "#1e293b" }}>
      <header style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#0f172a", fontSize: 28 }}>SuperDocs Agentic Document Review Dashboard</h1>
        <p style={{ color: "#64748b", marginTop: 4 }}>Upload any document format (PDF, DOCX, TXT, CSV, JSON, MD), run agentic analysis, and review findings</p>
      </header>

      {/* Document Ingestion Card */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 24, borderRadius: 8, marginBottom: 32 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#0f172a" }}>1. Ingest Document into Pile</h3>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Pile Name</label>
          <input
            value={pileName}
            onChange={(e) => setPileName(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
          />
        </div>

        {/* Upload Mode Selector */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => setMode("file")}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: mode === "file" ? "#3b82f6" : "#fff",
              color: mode === "file" ? "#fff" : "#475569",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📁 Upload File (PDF, DOCX, TXT, CSV, JSON, MD)
          </button>
          <button
            onClick={() => setMode("text")}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: mode === "text" ? "#3b82f6" : "#fff",
              color: mode === "text" ? "#fff" : "#475569",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ✍️ Paste Text
          </button>
        </div>

        {mode === "file" ? (
          <div style={{ marginBottom: 20, padding: 20, border: "2px dashed #cbd5e1", borderRadius: 8, textAlign: "center", background: "#fff" }}>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              style={{ display: "block", margin: "0 auto", fontSize: 14 }}
            />
            {selectedFile && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#059669", fontWeight: 600 }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Document Text</label>
            <textarea
              rows={5}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14, fontFamily: "monospace" }}
            />
          </div>
        )}

        <button
          onClick={handleUploadAndRun}
          disabled={loading || (mode === "file" && !selectedFile)}
          style={{ padding: "10px 20px", background: loading ? "#94a3b8" : "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14 }}
        >
          {loading ? "Processing Run..." : "Upload Document & Start Agentic Run"}
        </button>
      </div>

      {loading && (
        <div style={{
          margin: "20px 0",
          padding: "20px 24px",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          border: "1px solid #7dd3fc",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 4px 14px rgba(14, 165, 233, 0.15)",
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            border: "4px solid #bae6fd",
            borderTop: "4px solid #0284c7",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
            flexShrink: 0
          }} />
          <div>
            <div style={{ fontWeight: 700, color: "#0369a1", fontSize: "15px", transition: "all 0.3s ease" }}>
              {LOADING_STEPS[loadingStepIdx]}
            </div>
            <div style={{ fontSize: "12px", color: "#0284c7", marginTop: "4px" }}>
              Active Stage: {STAGES[Math.min(loadingStepIdx, STAGES.length - 1)]} • Executing graph nodes
            </div>
          </div>
        </div>
      )}

      {message && (
        <div style={{ padding: 12, background: "#e0f2fe", color: "#0369a1", borderRadius: 6, marginBottom: 24, fontSize: 14 }}>
          {message}
        </div>
      )}

      {/* Manual Run Lookup */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <input
          placeholder="Or enter existing Run ID..."
          value={runId}
          onChange={(e) => setRunId(e.target.value.trim())}
          style={{ padding: "8px 12px", width: 340, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
        />
        <button
          onClick={() => fetchRunData(runId)}
          disabled={!runId || loading}
          style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
        >
          Inspect Run
        </button>
      </div>

      {runStatus && (
        <div>
          {/* Status Header */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 20, borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Run Status</span>
                <h3 style={{ margin: "4px 0 0", fontSize: 18 }}>{runStatus.run_id}</h3>
              </div>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  background: runStatus.status === "completed" ? "#dcfce7" : runStatus.status === "awaiting_review" ? "#fef3c7" : "#e2e8f0",
                  color: runStatus.status === "completed" ? "#15803d" : runStatus.status === "awaiting_review" ? "#b45309" : "#475569",
                }}
              >
                {runStatus.status}
              </span>
            </div>

            {/* Stage Timeline */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Visible Pipeline Stages (Live Stepper)</span>
                <span style={{ fontSize: 11, color: "#0284c7", background: "#e0f2fe", padding: "2px 8px", borderRadius: 12 }}>
                  {runStatus.status === "awaiting_review" ? "Awaiting Human Review Gate" : runStatus.status === "completed" ? "Pipeline Execution Completed" : "Processing Stages..."}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {STAGES.map((s, idx) => {
                  const isCompleted = runStatus.status === "completed" || (runStatus.status === "awaiting_review" && s !== "commit" && s !== "human_review_gate");
                  const isCurrentGate = runStatus.status === "awaiting_review" && s === "human_review_gate";
                  const isPendingCommit = runStatus.status === "awaiting_review" && s === "commit";

                  return (
                    <div
                      key={s}
                      style={{
                        flex: 1,
                        padding: "10px 8px",
                        borderRadius: 8,
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        transition: "all 0.3s ease",
                        background: isCompleted ? "#f0fdf4" : isCurrentGate ? "#fffbeb" : isPendingCommit ? "#f8fafc" : "#f1f5f9",
                        border: isCompleted ? "1px solid #86efac" : isCurrentGate ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                        color: isCompleted ? "#15803d" : isCurrentGate ? "#b45309" : "#475569",
                        boxShadow: isCurrentGate ? "0 0 10px rgba(245, 158, 11, 0.25)" : "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isCompleted ? (
                          <span style={{ color: "#16a34a", fontSize: 13 }}>✓</span>
                        ) : isCurrentGate ? (
                          <span style={{ color: "#d97706", fontSize: 13, animation: "pulse-subtle 1.5s infinite" }}>⏳</span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 11 }}>●</span>
                        )}
                        <span>{s}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8 }}>
                        {isCompleted ? "Done" : isCurrentGate ? "Review Gate" : "Waiting"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pending Review Items */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>Pending Human Gate Reviews</h2>
              {runStatus.status === "awaiting_review" && (
                <button
                  onClick={handleFinalize}
                  style={{ padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                >
                  Finalize & Commit Batch
                </button>
              )}
            </div>

            {pending.findings.length === 0 && pending.conflicts.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", color: "#64748b" }}>
                No pending items requiring review for this run.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pending.findings.map((item) => (
                  <div key={item.id} style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 11, background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>
                        Finding ({item.severity})
                      </span>
                      <p style={{ margin: "8px 0 0", fontSize: 14, color: "#334155" }}>{item.description}</p>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>ID: {item.id}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleApprove(item.id)} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                        Approve
                      </button>
                      <button onClick={() => handleReject(item.id)} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}

                {pending.conflicts.map((item) => (
                  <div key={item.id} style={{ padding: 16, border: "1px solid #fe8a8a", borderRadius: 8, background: "#fff5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 11, background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>
                        Conflict
                      </span>
                      <p style={{ margin: "8px 0 0", fontSize: 14, color: "#334155" }}>{item.description}</p>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>ID: {item.id}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleApprove(item.id)} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                        Approve
                      </button>
                      <button onClick={() => handleReject(item.id)} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stage Cost & Latency Dashboard */}
          {costs && costs.by_stage && (
            <div>
              <h2 style={{ fontSize: 20, color: "#0f172a", marginBottom: 16 }}>Stage Cost & Latency Breakdown</h2>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", color: "#475569" }}>
                      <th style={{ padding: "10px 16px" }}>Stage</th>
                      <th style={{ padding: "10px 16px" }}>Tokens In</th>
                      <th style={{ padding: "10px 16px" }}>Tokens Out</th>
                      <th style={{ padding: "10px 16px" }}>Latency (ms)</th>
                      <th style={{ padding: "10px 16px" }}>Cost (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(costs.by_stage).map(([stageName, metrics]) => (
                      <tr key={stageName} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: "#334155" }}>{stageName}</td>
                        <td style={{ padding: "10px 16px" }}>{metrics.tokens_in}</td>
                        <td style={{ padding: "10px 16px" }}>{metrics.tokens_out}</td>
                        <td style={{ padding: "10px 16px" }}>{metrics.latency_ms} ms</td>
                        <td style={{ padding: "10px 16px" }}>${metrics.cost_usd.toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
