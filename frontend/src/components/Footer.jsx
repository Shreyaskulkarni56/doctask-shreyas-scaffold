import React from "react";

export default function Footer() {
  return (
    <footer style={{
      marginTop: "80px",
      padding: "24px 0",
      borderTop: "1px solid #e4e4e7",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "13px",
      color: "#71717a"
    }}>
      <div>© 2026 SuperDocsTask</div>
      <div>Built for the SuperDocs Engineering Task</div>
    </footer>
  );
}
