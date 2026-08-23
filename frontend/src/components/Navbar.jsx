import React from "react";

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav style={{
      padding: "24px 0",
      marginBottom: "48px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #e4e4e7"
    }}>
      <div
        onClick={() => setActiveTab("hero")}
        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
      >
        <span style={{ fontSize: "20px", fontWeight: 800, color: "#18181b", letterSpacing: "-0.04em" }}>
          DocTask
        </span>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
        <button
          onClick={() => setActiveTab("hero")}
          style={{
            background: "none",
            border: "none",
            fontSize: "14px",
            fontWeight: activeTab === "hero" ? 600 : 400,
            color: activeTab === "hero" ? "#18181b" : "#71717a",
            cursor: "pointer",
            padding: "4px 0",
            borderBottom: activeTab === "hero" ? "2px solid #ea580c" : "2px solid transparent",
            transition: "all 0.15s ease"
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            background: "none",
            border: "none",
            fontSize: "14px",
            fontWeight: activeTab === "dashboard" ? 600 : 400,
            color: activeTab === "dashboard" ? "#18181b" : "#71717a",
            cursor: "pointer",
            padding: "4px 0",
            borderBottom: activeTab === "dashboard" ? "2px solid #ea580c" : "2px solid transparent",
            transition: "all 0.15s ease"
          }}
        >
          Pipeline App
        </button>
        <button
          onClick={() => setActiveTab("blog")}
          style={{
            background: "none",
            border: "none",
            fontSize: "14px",
            fontWeight: activeTab === "blog" ? 600 : 400,
            color: activeTab === "blog" ? "#18181b" : "#71717a",
            cursor: "pointer",
            padding: "4px 0",
            borderBottom: activeTab === "blog" ? "2px solid #ea580c" : "2px solid transparent",
            transition: "all 0.15s ease"
          }}
        >
          Architecture
        </button>
        <button
          onClick={() => setActiveTab("journey")}
          style={{
            background: "none",
            border: "none",
            fontSize: "14px",
            fontWeight: activeTab === "journey" ? 600 : 400,
            color: activeTab === "journey" ? "#18181b" : "#71717a",
            cursor: "pointer",
            padding: "4px 0",
            borderBottom: activeTab === "journey" ? "2px solid #ea580c" : "2px solid transparent",
            transition: "all 0.15s ease"
          }}
        >
          Blog
        </button>
      </div>
    </nav>
  );
}
