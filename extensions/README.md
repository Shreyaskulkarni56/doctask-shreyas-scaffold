# Task 2.1: Authenticated Agent Connection Walkthrough

An end-to-end Python walkthrough demonstrating how an autonomous AI Agent (e.g. Cursor, Claude, custom bot) discovers, authenticates with, and operates the SuperDocs API/MCP server surface programmatically.

---

## 🚀 Overview

SuperDocs enables autonomous agents to perform document analysis, synthesis, and review without human browser interaction. This extension provides a standards-compliant client implementation of the 4-step agent workflow:

1. **Discovery (`GET /.well-known/mcp-configuration`)**: Querying the server to discover supported MCP versions, auth methods, and available tools.
2. **Authorization (`OAuth2 Bearer Token`)**: Exchanging agent client credentials for a Bearer token.
3. **Session Handshake (`JSON-RPC 2.0`)**: Initializing stateful transport over MCP.
4. **Operation Execution**: Invoking the 4 core SuperDocs tools programmatically:
   - `upload_document`: Ingest files/text into a pile.
   - `chat_edit_instruction`: Send targeted edit/analysis instructions.
   - `approve_changes`: Approve or reject proposed diffs item-by-item.
   - `export_document`: Export finalized deliverable documents.

---

## 📦 File Structure

```text
extensions/authenticated-agent-walkthrough/
├── authenticated_agent_walkthrough.py  # End-to-end Python walkthrough script
├── README.md                           # Documentation & execution guide
└── requirements.txt                    # Python dependencies (requests)
```

---

## ⚙️ How to Run

### 1. Prerequisites
Ensure Python 3.10+ is installed and your SuperDocs backend (or mock server) is running on `http://localhost:8000`.

### 2. Install Dependencies
```bash
pip install requests
```

### 3. Run the Walkthrough
```bash
python authenticated_agent_walkthrough.py
```

---

## 📑 Output Example

```text
[Step 1: Discovery] Querying agent discovery endpoint...
  -> Discovered MCP capabilities: {
  "mcp_version": "2024-11-05",
  "auth_type": "bearer",
  "tools": [
    "upload_document",
    "chat_edit_instruction",
    "approve_changes",
    "export_document"
  ],
  "endpoints": {
    "token": "http://localhost:8000/auth/token",
    "mcp": "http://localhost:8000/mcp"
  }
}

[Step 2: Authorization] Exchanging credentials for OAuth2 Bearer token...
  -> Authenticated successfully. Bearer token acquired.

[Step 3: MCP Tool Execution] Invoking core tools...
  -> [Tool Call: upload_document] Result: {'document_id': 'doc_8f9a2b', 'status': 'ingested'}
  -> [Tool Call: chat_edit_instruction] Result: {'instruction': 'Extract payment terms', 'status': 'queued'}
  -> [Tool Call: approve_changes] Result: {'approved_items': ['item_101'], 'status': 'committed'}
  -> [Tool Call: export_document] Result: {'export_url': 'http://localhost:8000/exports/doc_8f9a2b.md'}

[Complete] Agent connection walkthrough executed successfully.
```

---

## 📄 License
MIT License. Built for SuperDocs Extensions & Builds showcase.
