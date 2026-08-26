import React from "react";

const COMPANY_USE_CASES = [
  {
    id: 1,
    company: "Salesforce",
    title: "Vendor Contract Amendment Register",
    deliverable: "Living MSA & Terms Register",
    buyer: "VP of Procurement / General Counsel",
    icon: "☁️",
  },
  {
    id: 2,
    company: "Pfizer",
    title: "Clinical Trial Protocol & IRB Audit",
    deliverable: "Protocol & IRB Compliance Audit",
    buyer: "VP of Regulatory Affairs",
    icon: "🧪",
  },
  {
    id: 3,
    company: "Brookfield",
    title: "Lease Abstraction & Rent Roll",
    deliverable: "Master Rent Roll Register",
    buyer: "Chief Investment Officer",
    icon: "🏢",
  },
  {
    id: 4,
    company: "JPMorgan Chase",
    title: "Loan File & Debt Covenant Monitor",
    deliverable: "Debt Covenant Compliance Brief",
    buyer: "Chief Credit Officer",
    icon: "🏦",
  },
  {
    id: 5,
    company: "Stripe",
    title: "Software Architecture & API Alignment",
    deliverable: "Unified Architecture Brief",
    buyer: "CTO / VP of Engineering",
    icon: "💳",
  },
  {
    id: 6,
    company: "KKR",
    title: "M&A Due Diligence Room Synthesis",
    deliverable: "M&A Risk Matrix & Synthesis",
    buyer: "PE Partner / M&A Managing Director",
    icon: "📈",
  },
  {
    id: 7,
    company: "Lockheed Martin",
    title: "Subcontractor FAR/DFARS Audit",
    deliverable: "FAR/DFARS Flow-Down Register",
    buyer: "VP of Supply Chain Compliance",
    icon: "🚀",
  },
  {
    id: 8,
    company: "UnitedHealth",
    title: "Provider Credentialing Register",
    deliverable: "Master Credentialing Brief",
    buyer: "VP of Network Operations",
    icon: "🩺",
  },
  {
    id: 9,
    company: "Chubb",
    title: "Insurance Claim & Coverage Verification",
    deliverable: "Claim Resolution Brief",
    buyer: "Head of Commercial Claims",
    icon: "🛡️",
  },
  {
    id: 10,
    company: "Bechtel",
    title: "Site Change Order & Blueprint Log",
    deliverable: "Master Spec & Change Order Log",
    buyer: "VP of Construction",
    icon: "🏗️",
  },
  {
    id: 11,
    company: "Workday",
    title: "Enterprise Vendor MSA Tracker",
    deliverable: "Vendor SLA & Payment Terms Brief",
    buyer: "Head of Global Procurement",
    icon: "💼",
  },
  {
    id: 12,
    company: "Novartis",
    title: "IRB Safety & Clinical Compliance",
    deliverable: "Regulatory Audit Brief",
    buyer: "Head of Clinical Operations",
    icon: "🔬",
  },
  {
    id: 13,
    company: "Blackstone",
    title: "Portfolio Data Room Risk Synthesis",
    deliverable: "Due Diligence Risk Register",
    buyer: "Managing Director",
    icon: "📊",
  },
  {
    id: 14,
    company: "Datadog",
    title: "Architecture & OpenAPI Spec Sync",
    deliverable: "Unified Interface Spec",
    buyer: "VP of Product Engineering",
    icon: "⚡",
  },
];

export default function UseCasesMarquee() {
  // Duplicate array for seamless infinite right-to-left loop
  const doubleCases = [...COMPANY_USE_CASES, ...COMPANY_USE_CASES];

  return (
    <div style={{ marginTop: "50px", marginBottom: "30px", overflow: "hidden", position: "relative" }}>
      {/* SECTION HEADER */}
      <div style={{ marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#ea580c",
            backgroundColor: "#fff7ed",
            padding: "4px 12px",
            borderRadius: "9999px",
            border: "1px solid #ffedd5"
          }}>
            Target Enterprise Buyers & Companies
          </span>
          <span style={{ fontSize: "13px", color: "#71717a" }}>
            (Live Right-to-Left Ticker)
          </span>
        </div>
      </div>

      {/* GRADIENT FADE EDGES */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "60px",
        height: "100%",
        background: "linear-gradient(to right, #ffffff, rgba(255,255,255,0))",
        zIndex: 2,
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "60px",
        height: "100%",
        background: "linear-gradient(to left, #ffffff, rgba(255,255,255,0))",
        zIndex: 2,
        pointerEvents: "none"
      }} />

      {/* MARQUEE ANIMATED TRACK */}
      <div
        className="marquee-track"
        style={{
          display: "flex",
          gap: "16px",
          width: "max-content",
          animation: "marqueeRightToLeft 40s linear infinite",
        }}
      >
        {doubleCases.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            style={{
              width: "290px",
              minWidth: "290px",
              backgroundColor: "#fafafa",
              border: "1px solid #e4e4e7",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              justify: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.borderColor = "#fdba74";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(234, 88, 12, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#e4e4e7";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
            }}
          >
            <div>
              {/* COMPANY NAME BADGE */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#18181b",
                  backgroundColor: "#ffffff",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d4d4d8",
                  letterSpacing: "-0.02em"
                }}>
                  {item.company}
                </span>
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
              </div>

              {/* USE CASE TITLE */}
              <h4 style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#ea580c",
                margin: "0 0 6px 0",
                lineHeight: "1.3"
              }}>
                {item.title}
              </h4>

              {/* DELIVERABLE */}
              <p style={{
                fontSize: "12px",
                color: "#52525b",
                margin: "0 0 10px 0",
                lineHeight: "1.4"
              }}>
                <strong style={{ color: "#27272a" }}>Deliverable:</strong> {item.deliverable}
              </p>
            </div>

            {/* TARGET BUYER */}
            <div style={{
              borderTop: "1px stroke #f4f4f5",
              paddingTop: "8px",
              marginTop: "auto"
            }}>
              <div style={{ fontSize: "11px", color: "#71717a" }}>
                Target Role: <strong style={{ color: "#3f3f46" }}>{item.buyer}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CSS KEYFRAMES & HOVER PAUSE STYLES */}
      <style>{`
        @keyframes marqueeRightToLeft {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .marquee-track:hover {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
}
