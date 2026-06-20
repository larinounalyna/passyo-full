import React from "react";
import "./FinishedTaskCard.css";

export default function FinishedTaskCard({
  title = "Site Clearing & Initial Leveling",
  finishedDate = "FINISHED OCT 18",
}) {
  return (
    <div className="finished-card">
      <h3 className="finished-title">{title}</h3>

      <div className="finished-row">
        <span className="finished-icon">✓</span>
        <span className="finished-text">{finishedDate}</span>
      </div>
    </div>
  );
}
