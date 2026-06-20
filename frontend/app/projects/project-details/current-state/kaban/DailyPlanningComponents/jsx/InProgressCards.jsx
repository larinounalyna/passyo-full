import React from "react";
import "../css/InProgressCards.css";

export default function InProgressCard({
  wo = "#WO-3982",
  title = "Column Concrete Pouring",
  description = "Level 4, Sector B. 4/12 columns completed. Pump truck active.",
  timer = "04:22:15",
  progress = 33,
  location = "Level 4 - Sector B",
  attachments = 4,
  onMove,
  moveLabel = "Move"
}) {
  return (
    <div className="inprogress-card">
      <div className="inprogress-header">
        <div className="inprogress-info">
          <p className="inprogress-wo">{wo}</p>
          <h2 className="inprogress-title">{title}</h2>
          <p className="inprogress-desc">{description}</p>
        </div>
        <div className="inprogress-timer">
          <span className="timer-icon" aria-hidden="true">
            RUN
          </span>
          <span>{timer}</span>
        </div>
      </div>

      <div className="inprogress-progress">
        <div className="progress-header">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="inprogress-footer">
        <div className="inprogress-location">
          <span className="location-icon" aria-hidden="true">
            LOC
          </span>
          <span>{location}</span>
        </div>
        
        {onMove && (
          <button className="card-move-btn" onClick={(e) => { e.stopPropagation(); onMove(); }}>
            {moveLabel} →
          </button>
        )}
      </div>
    </div>
  );
}
