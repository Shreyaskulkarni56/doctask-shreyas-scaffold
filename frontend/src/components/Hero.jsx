import React from "react";

export default function Hero({ onStartPipeline, onExploreArchitecture }) {
  return (
    <section style={{
      maxWidth: "840px",
      margin: "0 auto",
      padding: "80px 0 100px",
      textAlign: "left"
    }}>
      {/* ONE simple line-art document pile icon */}
      <div style={{ marginBottom: "32px", color: "#18181b" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
      </div>

      {/* HEADLINE: Big bold sans-serif headline with exactly ONE word in accent color */}
      <h1 style={{
        fontSize: "52px",
        fontWeight: 800,
        lineHeight: 1.15,
        color: "#18181b",
        letterSpacing: "-0.03em",
        marginBottom: "24px"
      }}>
        Your documents can pile up. It's time they could{" "}
        <span style={{ color: "#ea580c" }}>explain</span> themselves.
      </h1>

      {/* SUBHEAD: Plain regular-weight body text */}
      <p style={{
        fontSize: "20px",
        fontWeight: 400,
        lineHeight: 1.6,
        color: "#52525b",
        marginBottom: "48px",
        maxWidth: "680px"
      }}>
        Every claim traced to its source. Every conflict flagged for approval.
      </p>

      {/* Two Buttons Max: One solid primary action, one outlined secondary action */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={onStartPipeline}
          style={{
            padding: "14px 28px",
            fontSize: "15px",
            fontWeight: 600,
            color: "#ffffff",
            backgroundColor: "#ea580c",
            border: "1px solid #ea580c",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          Run Agentic Pipeline
        </button>

        <button
          onClick={onExploreArchitecture}
          style={{
            padding: "14px 28px",
            fontSize: "15px",
            fontWeight: 500,
            color: "#18181b",
            backgroundColor: "transparent",
            border: "1px solid #d4d4d8",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          Explore Architecture
        </button>
      </div>
    </section>
  );
}
