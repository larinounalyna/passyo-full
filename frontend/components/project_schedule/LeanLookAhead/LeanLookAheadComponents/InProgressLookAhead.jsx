import React from "react";
import "./InProgressLookAhead.css";

export default function ActiveStructureCard({
  tag = "ACTIVE • STRUCTURE",
  title = "Column Rebar Set [Units 12–24]",
  activeTab = "conc",
  avatars = ["👤", "👤"],
}) {
  return (
    <div className="inprogress-lookahead-card">
      <div className="lookahead-header">
        <p className="lookahead-tag active">{tag}</p>
        <button className="lookahead-more-btn">⋯</button>
      </div>

      <h2 className="lookahead-title">{title}</h2>

      <div className="lookahead-footer">
        <div className="lookahead-tabs">
          <div
            className={`lookahead-tab ${activeTab === "conc" ? "active conc" : ""}`}
          >
            🎨 <span>CONC</span>
          </div>
          <div
            className={`lookahead-tab ${activeTab === "plan" ? "active plan" : ""}`}
          >
            📄 <span>PLAN</span>
          </div>
          <div
            className={`lookahead-tab ${activeTab === "logi" ? "active logi" : ""}`}
          >
            🔧 <span>LOGI</span>
          </div>
        </div>

        <div className="lookahead-avatars">
          {avatars.map((avatar, i) => (
            <div key={i} className="avatar">
              {avatar}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
