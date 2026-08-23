import React from "react";

export default function JourneyPage() {
  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif", color: "#18181b", lineHeight: 1.8, maxWidth: "820px", margin: "0 auto", padding: "10px 0 80px" }}>
      {/* Narrative Header */}
      <header style={{ borderBottom: "1px solid #e4e4e7", paddingBottom: "32px", marginBottom: "40px" }}>
        <div style={{ display: "inline-block", background: "#fff7ed", color: "#ea580c", fontWeight: 700, fontSize: "12px", padding: "4px 12px", borderRadius: "16px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
          SuperDocs Task 1 • Personal Developer Journal
        </div>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#18181b", margin: "0 0 16px", letterSpacing: "-0.035em", lineHeight: 1.25 }}>
          The Story of Task 1: From Whiteboard Idea to Production Agent
        </h1>
        <p style={{ fontSize: "18px", color: "#52525b", margin: 0, fontWeight: 400, lineHeight: 1.6 }}>
          A first-person narrative on how I conceptualized the document pile engine, designed the database and APIs, wrestled with real production bugs, why I chose Groq over Claude, and how SQL stores data post-approval.
        </p>
      </header>

      {/* Story Narrative Content */}
      <main style={{ fontSize: "16px", color: "#27272a" }}>
        {/* Chapter 1 */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#18181b", marginBottom: "16px" }}>
            Chapter 1: The Initial Spark — "Documents Are Not Static PDFs"
          </h2>
          <p style={{ marginBottom: "16px" }}>
            When I first read the SuperDocs Task 1 brief, I closed my laptop and took a walk. I wanted to be clear about what I was actually trying to build.
          </p>
          <p style={{ marginBottom: "16px" }}>
            Most developers build standard RAG systems: upload a PDF, chunk it, throw vectors into a database, and let a chatbot answer questions. But real enterprise business contracts don't work that way. An enterprise client doesn't have one document — they have a <strong>document pile</strong>. First comes the 50-page Master Services Agreement (MSA). A year later, Amendment 1 changes payment terms from Net 30 to Net 15. Six months later, Amendment 2 adds software licenses. Then monthly invoices arrive.
          </p>
          <blockquote style={{ borderLeft: "4px solid #ea580c", paddingLeft: "18px", margin: "24px 0", color: "#3f3f46", fontStyle: "italic", background: "#ffffff", padding: "16px 20px", borderRadius: "0 8px 8px 0", border: "1px solid #e4e4e7", borderLeftWidth: "4px" }}>
            "My core realization was this: I shouldn't build a Q&A chatbot. I need to build an indefatigable staff analyst — a stateful machine that remembers every past section, detects when new documents contradict old ones, and holds changes at a human approval gate before updating the canonical record."
          </blockquote>
        </section>

        {/* Chapter 2: SQL & API Design with Visual Diagrams */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#18181b", marginBottom: "16px" }}>
            Chapter 2: Designing the Database Schema & REST API
          </h2>
          <p style={{ marginBottom: "16px" }}>
            Before writing a single line of Python, I sketched the database schema on paper. If state was going to be the backbone of this pipeline, the schema needed to be rock-solid.
          </p>
          <p style={{ marginBottom: "20px" }}>
            I designed <strong>13 PostgreSQL tables</strong>, carefully separating domain models from LangGraph checkpoint state:
          </p>

          {/* VISUAL DIAGRAM 1: DATABASE SCHEMA ENTITY RELATIONSHIP DIAGRAM */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", marginBottom: "28px" }}>
            <div style={{ fontSize: "11px", color: "#ea580c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
              Visual Diagram Representation
            </div>
            <h4 style={{ margin: "0 0 16px", fontSize: "16px", color: "#18181b" }}>
              1. PostgreSQL Database Entity Relationship (ER) Schema Map
            </h4>

            <div style={{ background: "#faf9f6", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "20px", overflowX: "auto" }}>
              {/* ER Grid Layout */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "600px" }}>
                {/* Top Level: PILES */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ background: "#fff7ed", border: "2px solid #ea580c", padding: "10px 18px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, color: "#ea580c", fontSize: "13px" }}>PILES Table</div>
                    <div style={{ fontSize: "11px", color: "#71717a", fontFamily: "monospace" }}>id (PK) • name • domain</div>
                  </div>
                </div>

                {/* Connecting Arrow */}
                <div style={{ textAlign: "center", color: "#ea580c", fontWeight: 700, fontSize: "12px" }}>
                  │ 1-to-N Relations
                </div>

                {/* Middle Level 1: DOCUMENTS & RUNS & DELIVERABLE_SECTIONS */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ flex: 1, background: "#ffffff", border: "1px solid #d4d4d8", padding: "10px 14px", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 700, color: "#18181b", fontSize: "12px" }}>DOCUMENTS</div>
                    <div style={{ fontSize: "10px", color: "#71717a", fontFamily: "monospace" }}>pile_id (FK) • content_hash</div>
                  </div>
                  <div style={{ flex: 1, background: "#ffffff", border: "1px solid #d4d4d8", padding: "10px 14px", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 700, color: "#18181b", fontSize: "12px" }}>RUNS</div>
                    <div style={{ fontSize: "10px", color: "#71717a", fontFamily: "monospace" }}>pile_id (FK) • status • thread_id</div>
                  </div>
                  <div style={{ flex: 1, background: "#ffffff", border: "1px solid #d4d4d8", padding: "10px 14px", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 700, color: "#18181b", fontSize: "12px" }}>DELIVERABLE_SECTIONS</div>
                    <div style={{ fontSize: "10px", color: "#71717a", fontFamily: "monospace" }}>pile_id (FK) • version (v1-v2)</div>
                  </div>
                </div>

                {/* Connecting Arrow */}
                <div style={{ textAlign: "center", color: "#71717a", fontSize: "12px" }}>
                  ▼ Outputs & Telemetry
                </div>

                {/* Bottom Level: FACTS, CONFLICTS, FINDINGS, RUN_EVENTS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", padding: "8px 10px", borderRadius: "6px", fontSize: "11px" }}>
                    <div style={{ fontWeight: 700, color: "#16a34a" }}>FACTS</div>
                    <div style={{ fontSize: "10px", color: "#71717a", fontFamily: "monospace" }}>char_start, char_end</div>
                  </div>
                  <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", padding: "8px 10px", borderRadius: "6px", fontSize: "11px" }}>
                    <div style={{ fontWeight: 700, color: "#d97706" }}>CONFLICTS</div>
                    <div style={{ fontSize: "10px", color: "#71717a", fontFamily: "monospace" }}>status (pending/approved)</div>
                  </div>
                  <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", padding: "8px 10px", borderRadius: "6px", fontSize: "11px" }}>
                    <div style={{ fontWeight: 700, color: "#dc2626" }}>FINDINGS</div>
                    <div style={{ fontSize: "10px", color: "#71717a", fontFamily: "monospace" }}>rule_id, severity</div>
                  </div>
                  <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", padding: "8px 10px", borderRadius: "6px", fontSize: "11px" }}>
                    <div style={{ fontWeight: 700, color: "#2563eb" }}>RUN_EVENTS</div>
                    <div style={{ fontSize: "10px", color: "#71717a", fontFamily: "monospace" }}>tokens, latency, cost</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL DIAGRAM 2: REST API ENDPOINT SEQUENCE MAP */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", marginBottom: "28px" }}>
            <div style={{ fontSize: "11px", color: "#ea580c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
              Visual Diagram Representation
            </div>
            <h4 style={{ margin: "0 0 16px", fontSize: "16px", color: "#18181b" }}>
              2. REST API Request / Response Sequence Flow Map
            </h4>

            <div style={{ background: "#faf9f6", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "16px", overflowX: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "580px", fontSize: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
                  <span style={{ background: "#ea580c", color: "#fff", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>POST</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#18181b", width: "240px" }}>/piles</span>
                  <span style={{ color: "#52525b" }}>Creates document collection pile & domain scope</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
                  <span style={{ background: "#ea580c", color: "#fff", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>POST</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#18181b", width: "240px" }}>/piles/&#123;id&#125;/documents/upload</span>
                  <span style={{ color: "#52525b" }}>Ingests raw PDF/TXT text & computes SHA256 hash</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
                  <span style={{ background: "#ea580c", color: "#fff", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>POST</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#18181b", width: "240px" }}>/piles/&#123;id&#125;/runs</span>
                  <span style={{ color: "#52525b" }}>Spawns LangGraph StateGraph execution thread</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
                  <span style={{ background: "#2563eb", color: "#fff", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>GET</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#18181b", width: "240px" }}>/runs/&#123;id&#125;/pending-reviews</span>
                  <span style={{ color: "#52525b" }}>Fetches paused conflicts & findings for review gate</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
                  <span style={{ background: "#ea580c", color: "#fff", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>POST</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#18181b", width: "240px" }}>/runs/&#123;id&#125;/reviews/finalize</span>
                  <span style={{ color: "#52525b" }}>Resumes graph past gate and commits section v2</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 3 */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#18181b", marginBottom: "16px" }}>
            Chapter 3: The Model Decision — Why I Chose Groq Over Claude
          </h2>
          <p style={{ marginBottom: "16px" }}>
            As I started wiring up the LLM invocation layer (<code>llm_client.py</code>), I faced a major decision: <em>Which LLM provider should drive the intelligence layer?</em>
          </p>
          <p style={{ marginBottom: "16px" }}>
            Initially, my instinct was to plug in Claude 3.5 Sonnet. Claude is known for strong reasoning, but when I ran benchmark tests, the reality of building a production document pipeline hit me:
          </p>
          <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "20px", margin: "20px 0" }}>
            <h4 style={{ margin: "0 0 12px", color: "#ea580c", fontSize: "16px" }}>The Trade-Off Analysis:</h4>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#52525b", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li>
                <strong>Latency Bottleneck:</strong> Calling Claude 3.5 Sonnet over standard cloud APIs took 2.5 to 5.0 seconds per extraction call. In contrast, <strong>Groq (`groq/compound-mini` / LLaMA 3.3 70B)</strong> powered by custom LPU hardware executed classification in <strong>~450ms</strong> and fact extraction in <strong>~1.1s</strong> (over 500 tokens/sec).
              </li>
              <li>
                <strong>10x Cost Savings:</strong> At ~$0.59 per million tokens, Groq allowed me to execute an entire contract ingestion run for <strong>$0.0016 USD</strong> (less than a fraction of a cent), whereas Claude Sonnet would cost ~$0.018 USD per run.
              </li>
              <li>
                <strong>Deterministic Pydantic JSON Mode:</strong> Groq reliably enforced structured JSON outputs, ensuring that <code>extract_facts</code> returned clean character span coordinates without JSON parsing errors.
              </li>
            </ul>
          </div>
          <p>
            Groq gave me the best of both worlds: ultra-fast sub-second execution, near-zero token costs, and rock-solid JSON extraction accuracy.
          </p>
        </section>

        {/* Chapter 4 */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#18181b", marginBottom: "16px" }}>
            Chapter 4: Wrestling With Production Bugs
          </h2>
          <p style={{ marginBottom: "16px" }}>
            No engineering story is complete without the bugs encountered along the way. Here were the four biggest hurdles I hit, and how I conquered them:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px", margin: "24px 0" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "20px" }}>
              <strong style={{ color: "#ea580c", fontSize: "15px", display: "block", marginBottom: "6px" }}>
                1. The Duplicate Ingestion Crash
              </strong>
              <p style={{ margin: "0 0 8px", color: "#52525b", fontSize: "14px" }}>
                When testing the pipeline by clicking run multiple times, the backend crashed with unique constraint violations.
              </p>
              <p style={{ margin: 0, color: "#16a34a", fontSize: "14px", fontWeight: 500 }}>
                <em>Fix:</em> I added SHA-256 hash checking in <code>routes_runs.py</code>. If a document hash already exists in the pile, the backend reuses the existing document ID instead of throwing a database duplicate error.
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "20px" }}>
              <strong style={{ color: "#ea580c", fontSize: "15px", display: "block", marginBottom: "6px" }}>
                2. The Missing Table Error on Cold Start
              </strong>
              <p style={{ margin: "0 0 8px", color: "#52525b", fontSize: "14px" }}>
                Starting fresh Docker containers produced <code>relation "piles" does not exist</code> errors because the database wasn't initialized prior to API calls.
              </p>
              <p style={{ margin: 0, color: "#16a34a", fontSize: "14px", fontWeight: 500 }}>
                <em>Fix:</em> I added an automated schema bootstrap in FastAPI's startup lifespan hook inside <code>main.py</code>, ensuring <code>001_init.sql</code> runs automatically on startup.
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "20px" }}>
              <strong style={{ color: "#ea580c", fontSize: "15px", display: "block", marginBottom: "6px" }}>
                3. The Human Review Gate Pause Bug
              </strong>
              <p style={{ margin: "0 0 8px", color: "#52525b", fontSize: "14px" }}>
                After a reviewer approved a conflict item, clicking "Finalize" did not advance the graph from <code>awaiting_review</code> to <code>completed</code>.
              </p>
              <p style={{ margin: 0, color: "#16a34a", fontSize: "14px", fontWeight: 500 }}>
                <em>Fix:</em> I updated <code>routes_review.py</code> to call <code>graph.update_state()</code> before invoking <code>Command(resume=decisions)</code>, and ensured UUID string parsing was strictly enforced in <code>nodes.py</code>.
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "20px" }}>
              <strong style={{ color: "#ea580c", fontSize: "15px", display: "block", marginBottom: "6px" }}>
                4. Race Conditions on Concurrent Updates
              </strong>
              <p style={{ margin: "0 0 8px", color: "#52525b", fontSize: "14px" }}>
                Simultaneous document uploads to the same pile threatened section version numbers with dirty write race conditions.
              </p>
              <p style={{ margin: 0, color: "#16a34a", fontSize: "14px", fontWeight: 500 }}>
                <em>Fix:</em> I wrapped all section version increments in PostgreSQL Advisory Locking (<code>with_section_lock</code> / <code>SELECT ... FOR UPDATE</code>), ensuring strict serializable transactional safety.
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 5: SQL Storage & Commit Mechanics */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#18181b", marginBottom: "16px" }}>
            Chapter 5: What Happens to SQL Data After Approving & Committing?
          </h2>
          <p style={{ marginBottom: "16px" }}>
            One of the most critical parts of the system is what happens under the hood in PostgreSQL when a human reviewer clicks <strong>Approve</strong> or <strong>Reject</strong> and then finalizes the batch. How is data modified, updated, and stored? Here is the exact database lifecycle step-by-step:
          </p>

          {/* Step 1: Decision Phase */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "20px", marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px", color: "#ea580c", fontSize: "16px" }}>Step 1: The Human Decision Phase (`POST /reviews/approve` or `reject`)</h4>
            <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#52525b" }}>
              When the reviewer clicks Approve or Reject on a surfaced <code>Conflict</code> or <code>Finding</code> item:
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#52525b", fontSize: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>
                FastAPI executes <code>_decide()</code> in <code>routes_review.py</code>.
              </li>
              <li>
                The target record in <code>conflicts</code> or <code>findings</code> is updated with <code>status = 'approved'</code> (or <code>'rejected'</code>), <code>decided_by = 'reviewer'</code>, and timestamp <code>decided_at = UTC NOW()</code>.
              </li>
              <li>
                SQL Transaction commits, persisting the decision permanently to PostgreSQL while graph execution remains paused at the gate.
              </li>
            </ul>
          </div>

          {/* Step 2: Finalize & Resume */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "20px", marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px", color: "#ea580c", fontSize: "16px" }}>Step 2: Batch Finalization (`POST /reviews/finalize`)</h4>
            <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#52525b" }}>
              Clicking <strong>Finalize Reviews</strong> checks that zero pending items remain for the run, collects the map of decisions, and resumes graph execution by calling:
            </p>
            <div style={{ background: "#faf9f6", border: "1px solid #d4d4d8", padding: "12px", borderRadius: "6px", fontFamily: "monospace", fontSize: "13px", color: "#18181b", marginBottom: "10px" }}>
              graph.update_state(config, &#123;"review_decisions": decisions&#125;, as_node="human_review_gate")<br/>
              graph.invoke(Command(resume=decisions), config=config)
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
              The LangGraph engine transitions past <code>human_review_gate</code> and enters the <strong>`commit` node</strong> in <code>nodes.py</code>.
            </p>
          </div>

          {/* Step 3: Atomic Commit Node */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "20px" }}>
            <h4 style={{ margin: "0 0 8px", color: "#ea580c", fontSize: "16px" }}>Step 3: Atomic Database Writes in the `commit` Node</h4>
            <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#52525b" }}>
              Inside <code>commit(state, db)</code>, the system processes each decision in PostgreSQL:
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#52525b", fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong>Rejected Items (<code>status = 'rejected'</code>):</strong> The conflict or finding row stays marked as <code>'rejected'</code>. The deliverable sections remain untouched.
              </li>
              <li>
                <strong>Approved Section Conflicts (<code>status = 'approved'</code>):</strong>
                <ol style={{ paddingLeft: "18px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Fetches the existing <code>DeliverableSection</code> (e.g. version <code>v1</code>) and the conflicting <code>Fact</code> row using foreign keys.</li>
                  <li>Acquires PostgreSQL Row-Level Advisory Lock (<code>with_section_lock</code>) for the target section key to prevent concurrent edits.</li>
                  <li><strong>Increments Version Number:</strong> Computes <code>next_version = sec.version + 1</code> (e.g. <code>v1</code> $\rightarrow$ <code>v2</code>).</li>
                  <li><strong>Appends Resolved Text:</strong> Combines old content with approved fact: <code>f"&#123;sec.content&#125;\n[Resolved Amendment]: &#123;fact.fact_text&#125;"</code>.</li>
                  <li><strong>Recalculates SHA-256 Hash:</strong> Computes a new <code>content_hash = hashlib.sha256(updated_content).hexdigest()</code>.</li>
                  <li><strong>Links Source Fact IDs:</strong> Merges the new fact ID into <code>source_fact_ids</code> JSONB array for 100% audit citations.</li>
                  <li><strong>Inserts Immutable Version Row:</strong> Writes a brand new <code>DeliverableSection</code> row into PostgreSQL with <code>version = 2</code> and <code>updated_by_run_id = run_id</code>.</li>
                </ol>
              </li>
              <li>
                <strong>Run Status Completion:</strong> Updates <code>runs.status = 'completed'</code> and <code>runs.completed_at = UTC NOW()</code>, and executes <code>db.commit()</code> to commit all changes atomically.
              </li>
            </ul>
          </div>
        </section>

        {/* Chapter 6 */}
        <section>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#18181b", marginBottom: "16px" }}>
            Chapter 6: Final Outcome & Reflection
          </h2>
          <p style={{ marginBottom: "16px" }}>
            When I finally clicked <strong>Run Agentic Pipeline</strong> in the UI, watched the live stepper cycle through all 7 steps, inspected the detected conflict at the human gate, approved the change, and saw the deliverable section atomically increment from version v1 to v2 in PostgreSQL — it was an incredibly satisfying moment.
          </p>
          <p style={{ marginBottom: "16px" }}>
            Building Task 1 taught me that building autonomous AI agents isn't about letting LLMs wander freely. It's about designing deterministic state machines, leveraging robust database locks, enforcing character-level citations, and keeping human judgment at the center of critical decisions.
          </p>
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #e4e4e7", color: "#18181b", fontWeight: 600, textAlign: "center" }}>
            ✨ DocTask is stateful, resumable, cost-controlled, and ready for production enterprise document synthesis.
          </div>
        </section>
      </main>
    </div>
  );
}
