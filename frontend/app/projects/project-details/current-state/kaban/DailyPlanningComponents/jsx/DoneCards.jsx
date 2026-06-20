import React from "react";
import "../css/DoneCards.css";

export default function DoneTaskCard({
  wo = "#WO-3977",
  title = "Site Clearing – Zone A",
  subtitle = "Removal of debris after formwork stripping.",
  status = "VERIFIED",
  completedAt = "Completed 09:15 AM",
}) {
  return (
    <div className="done-card">
      <div className="done-card-header">
        <div className="done-card-info">
          <p className="done-wo">{wo}</p>
          <h2 className="done-title">{title}</h2>
          <p className="done-subtitle">{subtitle}</p>
        </div>
        <div className="done-check-icon">✓</div>
      </div>

      <div className="done-card-footer">
        <span className="done-status">{status}</span>
        <span className="done-time">{completedAt}</span>
      </div>
    </div>
  );
}
