import React, { useState, useEffect } from "react";
import UseCasesMarquee from "./UseCasesMarquee";

const STAGES = [
  "classify_documents",
  "extract_facts",
  "synthesize",
  "examine",
  "human_review_gate",
  "commit"
];

const LOADING_STEPS = [
  "1/7 Initializing Document Ingest & SHA-256 Deduplication...",
  "2/7 Executing Document Classification (Groq LLM)...",
  "3/7 Extracting Ground Truth Facts & Source Spans (Groq LLM)...",
  "4/7 Synthesizing Deliverable Sections (PostgreSQL DB)...",
  "5/7 Examining Rules & Surface Conflicts (PostgreSQL DB)...",
  "6/7 Pausing at Human Gate Review (LangGraph Gate)...",
  "7/7 Pipeline Ready for Human Approval!"
];

const NODE_DETAILS = {
  upload: {
    title: "📄 Stage 0: Document Ingestion",
    service: "FastAPI Backend & PostgreSQL",
    badge: "Ingestion Engine",
    description: "Ingests PDF or raw text contracts, calculates SHA-256 hash for deduplication, and persists ground truth raw document text into the database.",
    input: "PDF / TXT Document Bytes",
    output: "Document Record & SHA-256 Hash"
  },
  classify_documents: {
    title: "🔍 Stage 1: classify_documents",
    service: "Groq LLM (llama-3.3-70b)",
    badge: "LLM Node",
    description: "Determines document domain (e.g., vendor contracts, amendments, invoices) and identifies target document structure for downstream processing.",
    input: "Raw Document Text",
    output: "Document Domain Metadata"
  },
  extract_facts: {
    title: "⚡ Stage 2: extract_facts",
    service: "Groq LLM (llama-3.3-70b)",
    badge: "LLM Node",
    description: "Extracts structured facts with exact character spans (char_start, char_end) ensuring 'never bluffs' traceability against original documents.",
    input: "Document Text & Schema",
    output: "Fact Records with Exact Char Spans"
  },
  synthesize: {
    title: "⚖️ Stage 3: synthesize",
    service: "PostgreSQL Database Engine",
    badge: "Deterministic SQL Node",
    description: "Maps extracted facts to deliverable sections. Calculates content_hash to ensure untouched sections remain byte-identical across runs.",
    input: "Extracted Facts Array",
    output: "Draft Deliverable Sections"
  },
  examine: {
    title: "🛡️ Stage 4: examine",
    service: "PostgreSQL Database Engine",
    badge: "Compliance Rule Engine",
    description: "Evaluates compliance rules against extracted facts. Surface contradiction conflicts when new facts disagree with existing section versions.",
    input: "Deliverable Sections & Facts",
    output: "Pending Findings & Conflict Items"
  },
  human_review_gate: {
    title: "🚦 Stage 5: human_review_gate",
    service: "LangGraph Gate & State Checkpointer",
    badge: "Human-in-the-Loop Gate",
    description: "Pauses graph execution safely in 'awaiting_review' state. Requires human approval or rejection of section amendments before proceeding to commit.",
    input: "Pending Conflict & Finding Items",
    output: "Human Decision State Map"
  },
  commit: {
    title: "💾 Stage 6: commit",
    service: "PostgreSQL Database Engine",
    badge: "Transactional Commit Node",
    description: "Executes upon review finalization. Applies approved amendments to increment section versions (v1 -> v2), discards rejected items, and updates run status to completed.",
    input: "Approved/Rejected Review Decisions",
    output: "Finalized Section Versions (v2)"
  }
};

export default function Dashboard() {
  const [mode, setMode] = useState("text"); // "file" | "text"
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
  const [selectedNodeKey, setSelectedNodeKey] = useState("classify_documents");

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
      const resPile = await fetch(`${API_BASE}/piles?name=${encodeURIComponent(pileName)}&domain=vendor_contracts`, {
        method: "POST",
      });
      if (!resPile.ok) {
        const errorText = await resPile.text();
        throw new Error(`Failed to create pile: ${errorText}`);
      }
      const pileData = await resPile.json();
      const newPileId = pileData.pile_id;

      if (mode === "file" && selectedFile) {
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
        const textToSubmit = docText.trim() || "MASTER SERVICES AGREEMENT\n\nPayment terms: Net 30 days.\nPenalty rate: 1.5% per month on overdue invoices.";
        await fetch(`${API_BASE}/piles/${newPileId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_path: selectedFile ? selectedFile.name : "pasted_contract.txt",
            raw_text: textToSubmit,
          }),
        });
      }

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
    <div style={{ padding: "10px 0 40px" }}>
      {/* Control Card */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e4e4e7",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px"
      }}>
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#18181b", margin: 0 }}>
            Ingest & Process Document
          </h2>
          <p style={{ color: "#71717a", margin: "4px 0 0", fontSize: "14px" }}>
            Select a document pile and submit contract text or upload a PDF/Text file
          </p>
        </div>

        {/* Pile Name Input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#52525b", marginBottom: "6px" }}>
            Target Document Pile Name
          </label>
          <input
            value={pileName}
            onChange={(e) => setPileName(e.target.value)}
            placeholder="e.g. Vendor Contract Pile"
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "#faf9f6",
              border: "1px solid #d4d4d8",
              borderRadius: "8px",
              color: "#18181b",
              fontSize: "14px",
              fontWeight: 500,
              outline: "none"
            }}
          />
        </div>

        {/* Input Mode Selector */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <button
            onClick={() => setMode("file")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: mode === "file" ? "2px solid #ea580c" : "1px solid #e4e4e7",
              background: mode === "file" ? "#fff7ed" : "#faf9f6",
              color: mode === "file" ? "#ea580c" : "#71717a",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            📁 Upload PDF / Text File
          </button>
          <button
            onClick={() => setMode("text")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: mode === "text" ? "2px solid #ea580c" : "1px solid #e4e4e7",
              background: mode === "text" ? "#fff7ed" : "#faf9f6",
              color: mode === "text" ? "#ea580c" : "#71717a",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            📝 Paste Raw Text Content
          </button>
        </div>

        {mode === "file" ? (
          <div style={{
            border: "2px dashed #d4d4d8",
            borderRadius: "8px",
            padding: "24px 16px",
            textAlign: "center",
            background: "#faf9f6",
            marginBottom: "20px"
          }}>
            <input
              type="file"
              id="file-input"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ display: "none" }}
            />
            <label htmlFor="file-input" style={{ cursor: "pointer" }}>
              <div style={{ fontSize: "28px", marginBottom: "4px" }}>📄</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#18181b", marginBottom: "2px" }}>
                {selectedFile ? selectedFile.name : "Click to choose PDF or Text file"}
              </div>
              <div style={{ fontSize: "12px", color: "#71717a" }}>
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Supports PDF, TXT, MD format"}
              </div>
            </label>
          </div>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <textarea
              rows={5}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "#faf9f6",
                border: "1px solid #d4d4d8",
                borderRadius: "8px",
                color: "#18181b",
                fontSize: "13px",
                fontFamily: "monospace",
                lineHeight: 1.5,
                outline: "none"
              }}
            />
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handleUploadAndRun}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: "8px",
            border: "none",
            background: loading ? "#a1a1aa" : "#ea580c",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          {loading ? "Processing Pipeline Stages..." : "Run Agentic Pipeline"}
        </button>
      </div>

      {/* Dynamic Stepper Loading Banner */}
      {loading && (
        <div style={{
          margin: "0 0 24px",
          padding: "16px 20px",
          background: "#fff7ed",
          border: "1px solid #ffedd5",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "14px"
        }}>
          <div style={{
            width: "24px",
            height: "24px",
            border: "3px solid #fdba74",
            borderTop: "3px solid #ea580c",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
            flexShrink: 0
          }} />
          <div>
            <div style={{ fontWeight: 600, color: "#9a3412", fontSize: "14px" }}>
              {LOADING_STEPS[loadingStepIdx]}
            </div>
            <div style={{ fontSize: "12px", color: "#c2410c", marginTop: "2px" }}>
              Active Stage: <strong>{STAGES[Math.min(loadingStepIdx, STAGES.length - 1)]}</strong> • Graph executing
            </div>
          </div>
        </div>
      )}

      {message && (
        <div style={{ padding: "12px 16px", background: "#f4f4f5", border: "1px solid #e4e4e7", color: "#18181b", borderRadius: "8px", marginBottom: "24px", fontSize: "13px", fontWeight: 500 }}>
          {message}
        </div>
      )}

      {/* Manual Run Search Bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", alignItems: "center" }}>
        <input
          placeholder="Or enter existing Run UUID..."
          value={runId}
          onChange={(e) => setRunId(e.target.value.trim())}
          style={{ padding: "10px 14px", width: "340px", borderRadius: "8px", background: "#ffffff", border: "1px solid #d4d4d8", color: "#18181b", fontSize: "13px", outline: "none" }}
        />
        <button
          onClick={() => fetchRunData(runId)}
          disabled={!runId || loading}
          style={{ padding: "10px 16px", background: "#f4f4f5", border: "1px solid #d4d4d8", color: "#18181b", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
        >
          Inspect Run
        </button>
      </div>

      {/* Interactive Backend Architecture & Flow Visualizer */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#ea580c", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
              Architecture & Workflow Visualizer
            </div>
            <h3 style={{ margin: "2px 0 0", fontSize: "16px", color: "#18181b" }}>
              Backend Agentic Pipeline Flow Map
            </h3>
          </div>
          <span style={{ fontSize: "11px", background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>
            Click any node to inspect mechanics
          </span>
        </div>

        {/* Connected Node Flow Grid */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", padding: "8px 2px 16px" }}>
          {[
            { key: "upload", icon: "📄", label: "Doc Ingest", sub: "FastAPI / DB" },
            { key: "classify_documents", icon: "🔍", label: "1. classify", sub: "Groq LLM" },
            { key: "extract_facts", icon: "⚡", label: "2. extract", sub: "Groq LLM" },
            { key: "synthesize", icon: "⚖️", label: "3. synthesize", sub: "Postgres DB" },
            { key: "examine", icon: "🛡️", label: "4. examine", sub: "Postgres DB" },
            { key: "human_review_gate", icon: "🚦", label: "5. human_gate", sub: "LangGraph Gate" },
            { key: "commit", icon: "💾", label: "6. commit", sub: "Postgres DB" },
          ].map((item, idx, array) => {
            const isSelected = selectedNodeKey === item.key;
            const isActive = loading && (
              (item.key === "upload" && loadingStepIdx <= 1) ||
              (item.key === "classify_documents" && loadingStepIdx === 2) ||
              (item.key === "extract_facts" && loadingStepIdx === 3) ||
              (item.key === "synthesize" && loadingStepIdx === 4) ||
              (item.key === "examine" && loadingStepIdx === 5) ||
              (item.key === "human_review_gate" && loadingStepIdx === 6)
            );

            return (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setSelectedNodeKey(item.key)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: isSelected ? "#fff7ed" : "#ffffff",
                    border: isSelected ? "2px solid #ea580c" : "1px solid #e4e4e7",
                    color: isSelected ? "#c2410c" : "#18181b",
                    cursor: "pointer",
                    textAlign: "center",
                    minWidth: "105px",
                    transition: "all 0.15s ease",
                    animation: isActive ? "radar-pulse 1.8s infinite" : "none"
                  }}
                >
                  <div style={{ fontSize: "18px", marginBottom: "2px" }}>{item.icon}</div>
                  <div style={{ fontSize: "11px", fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: "10px", color: isSelected ? "#c2410c" : "#71717a", marginTop: "1px" }}>{item.sub}</div>
                </button>

                {idx < array.length - 1 && (
                  <div style={{ position: "relative", width: "18px", height: "2px", background: "#e4e4e7" }}>
                    {isActive && (
                      <div style={{
                        position: "absolute",
                        top: "-3px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#ea580c",
                        animation: "flow-pulse 1s linear infinite"
                      }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Node Details Card */}
        {selectedNodeKey && NODE_DETAILS[selectedNodeKey] && (
          <div style={{
            background: "#faf9f6",
            border: "1px solid #e4e4e7",
            borderRadius: "8px",
            padding: "16px 18px",
            marginTop: "4px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "15px", color: "#18181b", display: "flex", alignItems: "center", gap: "6px" }}>
                {NODE_DETAILS[selectedNodeKey].title}
              </h4>
              <span style={{ fontSize: "11px", background: "#fff7ed", color: "#ea580c", border: "1px solid #ffedd5", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                {NODE_DETAILS[selectedNodeKey].badge}
              </span>
            </div>

            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#52525b", lineHeight: 1.5 }}>
              {NODE_DETAILS[selectedNodeKey].description}
            </p>

            <div style={{ display: "flex", gap: "12px", fontSize: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "150px", background: "#ffffff", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
                <span style={{ color: "#71717a", fontSize: "10px", textTransform: "uppercase", display: "block", marginBottom: "2px", fontWeight: 700 }}>
                  Service / Engine
                </span>
                <span style={{ color: "#ea580c", fontWeight: 600 }}>
                  {NODE_DETAILS[selectedNodeKey].service}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: "150px", background: "#ffffff", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
                <span style={{ color: "#71717a", fontSize: "10px", textTransform: "uppercase", display: "block", marginBottom: "2px", fontWeight: 700 }}>
                  Input Data
                </span>
                <span style={{ color: "#18181b" }}>
                  {NODE_DETAILS[selectedNodeKey].input}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: "150px", background: "#ffffff", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
                <span style={{ color: "#71717a", fontSize: "10px", textTransform: "uppercase", display: "block", marginBottom: "2px", fontWeight: 700 }}>
                  Output Result
                </span>
                <span style={{ color: "#16a34a", fontWeight: 600 }}>
                  {NODE_DETAILS[selectedNodeKey].output}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Run Status Results & Review Gate */}
      {runStatus && (
        <div>
          {/* Status Header */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#71717a", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Run UUID</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "16px", color: "#ea580c", fontFamily: "monospace" }}>{runStatus.run_id}</h3>
              </div>
              <span
                style={{
                  padding: "5px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: runStatus.status === "completed" ? "#f0fdf4" : runStatus.status === "awaiting_review" ? "#fffbeb" : "#f4f4f5",
                  border: runStatus.status === "completed" ? "1px solid #bbf7d0" : runStatus.status === "awaiting_review" ? "1px solid #fde68a" : "1px solid #e4e4e7",
                  color: runStatus.status === "completed" ? "#16a34a" : runStatus.status === "awaiting_review" ? "#b45309" : "#52525b",
                }}
              >
                {runStatus.status}
              </span>
            </div>

            {/* Stage Timeline Stepper */}
            <div style={{ marginTop: "20px" }}>
              <div style={{ fontSize: "12px", color: "#71717a", marginBottom: "10px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Pipeline Stepper</span>
                <span style={{ fontSize: "11px", color: "#ea580c", background: "#fff7ed", padding: "2px 8px", borderRadius: "10px" }}>
                  {runStatus.status === "awaiting_review" ? "Awaiting Review Gate" : runStatus.status === "completed" ? "Completed" : "Processing"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                {STAGES.map((s) => {
                  const isCompleted = runStatus.status === "completed" || (runStatus.status === "awaiting_review" && s !== "commit" && s !== "human_review_gate");
                  const isCurrentGate = runStatus.status === "awaiting_review" && s === "human_review_gate";

                  return (
                    <div
                      key={s}
                      style={{
                        flex: 1,
                        minWidth: "110px",
                        padding: "10px 8px",
                        borderRadius: "8px",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        transition: "all 0.15s ease",
                        background: isCompleted ? "#f0fdf4" : isCurrentGate ? "#fffbeb" : "#faf9f6",
                        border: isCompleted ? "1px solid #bbf7d0" : isCurrentGate ? "2px solid #f59e0b" : "1px solid #e4e4e7",
                        color: isCompleted ? "#16a34a" : isCurrentGate ? "#b45309" : "#71717a",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "3px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {isCompleted ? (
                          <span style={{ color: "#16a34a", fontSize: "12px" }}>✓</span>
                        ) : isCurrentGate ? (
                          <span style={{ color: "#d97706", fontSize: "12px" }}>⏳</span>
                        ) : (
                          <span style={{ color: "#a1a1aa", fontSize: "10px" }}>●</span>
                        )}
                        <span>{s}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pending Review Items Card */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#18181b" }}>
                  Pending Human Gate Reviews
                </h2>
                <p style={{ margin: "1px 0 0", fontSize: "13px", color: "#71717a" }}>
                  Approve or reject section amendments before batch commit
                </p>
              </div>
              {runStatus.status === "awaiting_review" && (
                <button
                  onClick={handleFinalize}
                  style={{
                    padding: "9px 18px",
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "13px"
                  }}
                >
                  Finalize & Commit Batch
                </button>
              )}
            </div>

            {pending.findings.length === 0 && pending.conflicts.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", background: "#ffffff", borderRadius: "8px", border: "1px dashed #d4d4d8", color: "#71717a", fontSize: "13px" }}>
                ✨ No pending items requiring review for this run. Graph executed cleanly.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pending.findings.map((item) => (
                  <div key={item.id} style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid #ef4444" }}>
                    <div>
                      <span style={{ fontSize: "11px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase" }}>
                        Finding ({item.severity})
                      </span>
                      <p style={{ margin: "6px 0 2px", fontSize: "14px", color: "#18181b", fontWeight: 500 }}>{item.description}</p>
                      <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>ID: {item.id}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleApprove(item.id)} style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>
                        Approve
                      </button>
                      <button onClick={() => handleReject(item.id)} style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}

                {pending.conflicts.map((item) => (
                  <div key={item.id} style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid #f59e0b" }}>
                    <div>
                      <span style={{ fontSize: "11px", background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase" }}>
                        Section Conflict
                      </span>
                      <p style={{ margin: "6px 0 2px", fontSize: "14px", color: "#18181b", fontWeight: 500 }}>{item.description}</p>
                      <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>ID: {item.id}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleApprove(item.id)} style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>
                        Approve
                      </button>
                      <button onClick={() => handleReject(item.id)} style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stage Cost & Latency Breakdown Table */}
          {costs && costs.by_stage && (
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", overflow: "hidden" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#18181b", marginBottom: "14px" }}>
                Stage Cost & Telemetry Breakdown
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e4e4e7", color: "#71717a", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <th style={{ padding: "10px 14px" }}>Stage Node</th>
                      <th style={{ padding: "10px 14px" }}>Tokens In</th>
                      <th style={{ padding: "10px 14px" }}>Tokens Out</th>
                      <th style={{ padding: "10px 14px" }}>Latency (ms)</th>
                      <th style={{ padding: "10px 14px" }}>Cost (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(costs.by_stage).map(([stageName, metrics]) => (
                      <tr key={stageName} style={{ borderBottom: "1px solid #f4f4f5" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#18181b" }}>{stageName}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "#f4f4f5", color: "#18181b", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                            {metrics.tokens_in}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "#f4f4f5", color: "#18181b", padding: "2px 8px", borderRadius: "4px", fontSize: 12, fontWeight: 600 }}>
                            {metrics.tokens_out}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#52525b", fontWeight: 500 }}>{metrics.latency_ms} ms</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700 }}>
                            ${metrics.cost_usd.toFixed(6)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-World Enterprise Use Cases Right-to-Left Marquee */}
      <UseCasesMarquee />
    </div>
  );
}
