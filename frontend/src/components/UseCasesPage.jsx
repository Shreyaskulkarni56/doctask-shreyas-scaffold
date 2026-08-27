import React, { useState } from "react";

const USE_CASES_DATA = [
  {
    id: 1,
    isTopPick: true,
    title: "1. Vendor Contract & Amendment Register (Legal & Procurement)",
    problem: "Multi-year vendor agreements accumulate conflicting amendments, SLA penalty changes, and side letters over time.",
    deliverable: "Living Master Services Agreement (MSA) & Terms Register with character-level citation spans.",
    buyer: "Head of Legal Operations / VP of Global Procurement",
    companies: "Salesforce, Workday, ServiceNow, Snowflake, Datadog",
    pitch: "When your team receives Amendment #3 for a key SaaS vendor, how do you verify it doesn't silently contradict SLA penalty clauses set in Amendment #1 without spending 4 hours manually cross-referencing PDFs?"
  },
  {
    id: 2,
    isTopPick: false,
    title: "2. Clinical Trial Protocol & IRB Compliance Audit (Pharma & Biotech)",
    problem: "Clinical trials generate continuous protocol amendments and site disclosures; non-compliance risks FDA holds.",
    deliverable: "Grounded Clinical Trial Protocol & IRB Audit Trail Report.",
    buyer: "VP of Regulatory Affairs / Head of Clinical Operations",
    companies: "Pfizer, Novartis, Roche, Gilead Sciences, Bristol Myers Squibb",
    pitch: "How long does it take your clinical ops team to audit a site amendment against 500+ pages of master trial filings?"
  },
  {
    id: 3,
    isTopPick: false,
    title: "3. Commercial Real Estate Lease Abstraction & Rent Roll (Real Estate)",
    problem: "Commercial REITs manage hundreds of leases with complex escalation clauses and tenant improvement allowances (TIAs).",
    deliverable: "Master Rent Roll & Lease Abstraction Register.",
    buyer: "Chief Investment Officer (CIO) / VP of Asset Management",
    companies: "Brookfield Asset Management, CBRE, Prologis, JLL, Cushman & Wakefield",
    pitch: "During acquisition due diligence, how do you catch hidden co-tenancy clause conflicts across 200 retail lease amendments?"
  },
  {
    id: 4,
    isTopPick: false,
    title: "4. Enterprise Credit Agreement & Debt Covenant Monitoring (Banking)",
    problem: "Commercial banks monitor syndicated loans with complex credit agreements and quarterly financial certificates.",
    deliverable: "Living Debt Covenant & Financial Compliance Audit Register.",
    buyer: "Chief Credit Officer / Head of Commercial Loan Operations",
    companies: "JPMorgan Chase, Bank of America, Wells Fargo, Citi, Ares Management",
    pitch: "When a borrower submits a quarterly compliance certificate, how do you verify financial definition changes against the original credit agreement automatically?"
  },
  {
    id: 5,
    isTopPick: false,
    title: "5. Architectural Specifications & Site Change Order Register (Construction)",
    problem: "Mega-construction projects face frequent site change orders and blueprint updates causing budget overruns.",
    deliverable: "Master Project Specification & Change Order Conflict Log.",
    buyer: "VP of Construction / Project Executive / Chief Engineering Officer",
    companies: "Bechtel, Turner Construction, Skanska, AECOM, Jacobs Engineering",
    pitch: "How do your site managers verify that Subcontractor Change Order #12 doesn't violate master structural engineering specifications issued 6 months ago?"
  },
  {
    id: 6,
    isTopPick: false,
    title: "6. Commercial Insurance Claim File & Coverage Analysis (Insurance)",
    problem: "Complex commercial property & casualty claims involve adjuster notes, police reports, and endorsement schedules.",
    deliverable: "Grounded Claim Resolution Brief & Exclusion Conflict Analysis.",
    buyer: "Head of Commercial Claims / VP of Underwriting",
    companies: "Chubb, Travelers, AIG, Liberty Mutual, Zurich Insurance",
    pitch: "When an adjuster reviews a $5M commercial property claim with 15 endorsement filings, how do you ensure zero policy exclusion misattributions?"
  },
  {
    id: 7,
    isTopPick: false,
    title: "7. Defense & Aerospace Subcontractor Compliance (Defense Contracting)",
    problem: "Defense contractors must enforce FAR/DFARS cybersecurity and materials compliance clauses across supplier document piles.",
    deliverable: "FAR/DFARS Flow-Down Compliance Audit Register.",
    buyer: "VP of Supply Chain Compliance / Director of Federal Contracts",
    companies: "Lockheed Martin, Raytheon Technologies, Northrop Grumman, General Dynamics",
    pitch: "How do you audit sub-tier supplier documentation to guarantee FAR/DFARS flow-down compliance across 1,000+ subcontractor files?"
  },
  {
    id: 8,
    isTopPick: false,
    title: "8. M&A Due Diligence Data Room Synthesis (Private Equity & M&A)",
    problem: "Private equity deal teams review thousands of target company files during tight 30-day exclusivity windows.",
    deliverable: "M&A Due Diligence Risk & Contract Conflict Matrix.",
    buyer: "Private Equity Partner / M&A Managing Director",
    companies: "KKR, Blackstone, Carlyle Group, Thoma Bravo, Vista Equity Partners",
    pitch: "During 30-day exclusivity, how do your deal associates surface change-of-control clause conflicts across top 100 customer contracts?"
  },
  {
    id: 9,
    isTopPick: false,
    title: "9. IT Infrastructure & Cloud Security Policy Audit (Enterprise IT)",
    problem: "Enterprise IT teams manage complex cloud vendor SLAs, SOC 2 audit reports, and data processing addendums (DPAs).",
    deliverable: "Master IT Security & Cloud SLA Compliance Brief.",
    buyer: "Chief Information Security Officer (CISO) / VP of IT Infrastructure",
    companies: "CrowdStrike, Palantir, Okta, Zscaler, Cloudflare",
    pitch: "How do you audit new cloud vendor DPAs against your enterprise master security baselines automatically?"
  },
  {
    id: 10,
    isTopPick: false,
    title: "10. Energy & Utility Power Purchase Agreement (PPA) Register (Utilities)",
    problem: "Energy utilities manage long-term 20-year Power Purchase Agreements (PPAs) with complex tariff adjustments.",
    deliverable: "Master PPA Tariff & Renewable Energy Credit (REC) Register.",
    buyer: "VP of Regulatory & Energy Trading / Chief Commercial Officer",
    companies: "NextEra Energy, Duke Energy, Exelon, Southern Company",
    pitch: "How do your energy traders track tariff escalator amendments across 50 regional power purchase agreements?"
  }
];

export default function UseCasesPage() {
  const [selectedId, setSelectedId] = useState(1);
  const selectedCase = USE_CASES_DATA.find((item) => item.id === selectedId) || USE_CASES_DATA[0];

  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif", color: "#18181b", lineHeight: 1.7, maxWidth: "900px", margin: "0 auto", padding: "10px 0 60px" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #e4e4e7", paddingBottom: "24px", marginBottom: "28px" }}>
        <div style={{ display: "inline-block", background: "#fff7ed", color: "#ea580c", fontWeight: 700, fontSize: "12px", padding: "4px 12px", borderRadius: "16px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
          SuperDocs Market & Buyer Analysis
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#18181b", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
          Target Enterprise Use Cases & Buyer Personas
        </h1>
        <p style={{ fontSize: "16px", color: "#52525b", margin: 0, fontWeight: 400 }}>
          Detailed breakdown of 10 enterprise sectors, buyer roles, buyer companies, and door-opener messaging.
        </p>

        {/* Non-Contact Compliance Banner */}
        <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "12px 16px", marginTop: "16px", fontSize: "13px", color: "#52525b" }}>
          🔒 <strong>Outreach Compliance Disclosure:</strong> No contact has been made with any named company or role. Analysis is strictly for positioning strategy.
        </div>
      </header>

      {/* Top Pick Highlight Card */}
      <div style={{ background: "#ffffff", border: "2px solid #ea580c", borderRadius: "12px", padding: "20px", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ background: "#ea580c", color: "#ffffff", fontWeight: 800, fontSize: "11px", padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase" }}>
            🏆 #1 Absolute Best Market Fit
          </span>
          <span style={{ fontSize: "12px", color: "#ea580c", fontWeight: 600 }}>Top Recommendation</span>
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#18181b" }}>
          Vendor Contract & Amendment Register (Legal & Procurement)
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#52525b" }}>
          Multi-year vendor agreements accumulate conflicting amendments, SLA changes, and side letters over time. Procurement & Legal Ops teams have dedicated SaaS budget for managing these contracts.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px" }}>
          <span style={{ background: "#faf9f6", border: "1px solid #e4e4e7", padding: "4px 10px", borderRadius: "6px" }}>
            <strong>Buyer:</strong> Head of Legal Ops / VP Procurement
          </span>
          <span style={{ background: "#faf9f6", border: "1px solid #e4e4e7", padding: "4px 10px", borderRadius: "6px" }}>
            <strong>Target Companies:</strong> Salesforce, Workday, ServiceNow, Snowflake, Datadog
          </span>
        </div>
      </div>

      {/* Interactive Use Case Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px" }}>
        {/* Left Side: Selectable List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#71717a", textTransform: "uppercase", marginBottom: "4px" }}>
            Select Sector Use Case:
          </div>
          {USE_CASES_DATA.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: isSelected ? "2px solid #ea580c" : "1px solid #e4e4e7",
                  background: isSelected ? "#fff7ed" : "#ffffff",
                  color: isSelected ? "#c2410c" : "#18181b",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.title}
                </span>
                {item.isTopPick && (
                  <span style={{ fontSize: "10px", background: "#ea580c", color: "#fff", padding: "1px 6px", borderRadius: "4px", flexShrink: 0 }}>
                    TOP
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Detailed Details Card */}
        <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "24px" }}>
          <div style={{ fontSize: "11px", color: "#ea580c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
            Sector Deep Dive #{selectedCase.id}
          </div>
          <h3 style={{ margin: "0 0 16px", fontSize: "18px", color: "#18181b", lineHeight: 1.3 }}>
            {selectedCase.title}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px" }}>
            <div style={{ background: "#faf9f6", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e4e4e7" }}>
              <strong style={{ color: "#18181b", display: "block", marginBottom: "2px", fontSize: "12px", textTransform: "uppercase" }}>
                The Core Problem
              </strong>
              <p style={{ margin: 0, color: "#52525b", fontSize: "13px" }}>{selectedCase.problem}</p>
            </div>

            <div style={{ background: "#faf9f6", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e4e4e7" }}>
              <strong style={{ color: "#18181b", display: "block", marginBottom: "2px", fontSize: "12px", textTransform: "uppercase" }}>
                Living Deliverable
              </strong>
              <p style={{ margin: 0, color: "#ea580c", fontWeight: 600, fontSize: "13px" }}>{selectedCase.deliverable}</p>
            </div>

            <div style={{ background: "#faf9f6", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e4e4e7" }}>
              <strong style={{ color: "#18181b", display: "block", marginBottom: "2px", fontSize: "12px", textTransform: "uppercase" }}>
                Target Buyer Roles
              </strong>
              <p style={{ margin: 0, color: "#18181b", fontWeight: 600, fontSize: "13px" }}>{selectedCase.buyer}</p>
            </div>

            <div style={{ background: "#faf9f6", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e4e4e7" }}>
              <strong style={{ color: "#18181b", display: "block", marginBottom: "2px", fontSize: "12px", textTransform: "uppercase" }}>
                Target Buyer Companies
              </strong>
              <p style={{ margin: 0, color: "#2563eb", fontWeight: 600, fontSize: "13px" }}>{selectedCase.companies}</p>
            </div>

            <div style={{ background: "#fff7ed", padding: "14px", borderRadius: "8px", border: "1px solid #ffedd5" }}>
              <strong style={{ color: "#c2410c", display: "block", marginBottom: "4px", fontSize: "12px", textTransform: "uppercase" }}>
                Door-Opener Cold Pitch
              </strong>
              <p style={{ margin: 0, color: "#9a3412", fontStyle: "italic", fontSize: "13px" }}>"{selectedCase.pitch}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
