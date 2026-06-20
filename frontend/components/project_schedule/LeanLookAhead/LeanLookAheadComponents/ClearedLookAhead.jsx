import React from "react";
import "./ClearedLookAhead.css";

export default function ClearedTaskCard({
  tag = "CLEARED",
  title = "MEP Rough-in [Plumbing/Electrical]",
  buttonLabel = "GO",
  activeTab = "conc",
}) {
  return (
    <div className="cleared-lookahead-card">
      <div className="cleared-header">
        <div className="cleared-tag">
          <span className="cleared-dot"></span>
          {tag}
        </div>
        <button className="cleared-more-btn">⋯</button>
      </div>

      <h2 className="cleared-title">{title}</h2>

      <div className="cleared-footer">
        <div className="cleared-tabs">
          <div
            className={`cleared-tab-icon ${activeTab === "conc" ? "active" : ""}`}
          >
            🎨
          </div>
          <div
            className={`cleared-tab-icon ${activeTab === "plan" ? "active" : ""}`}
          >
            📄
          </div>
          <div
            className={`cleared-tab-icon ${activeTab === "logi" ? "active" : ""}`}
          >
            🔧
          </div>
        </div>

        <button className="cleared-go-btn">{buttonLabel}</button>
      </div>
    </div>
  );
}
