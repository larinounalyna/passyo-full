import React from "react";
import "./upcomingtask.css";

export default function TaskLightCard({
  tag = "#TSK-882 • FOUNDATION",
  title = "Elevator Pit Pour & Rebar\nreinforcement",
  dueLabel = "DUE DATE",
  dueDate = "Oct 24",
  activeTab = "conc",
}) {
  return (
    <div className="upcoming-task-card">
      <div className="task-header">
        <p className="task-tag">{tag}</p>
        <button className="task-more-btn">⋯</button>
      </div>

      <h2 className="task-title">{title}</h2>

      <div className="task-footer">
        <div className="task-tabs">
          <div
            className={`task-tab ${activeTab === "conc" ? "active conc" : ""}`}
          >
            🎨 <span>CONC</span>
          </div>
          <div
            className={`task-tab ${activeTab === "plan" ? "active plan" : ""}`}
          >
            📄 <span>PLAN</span>
          </div>
          <div
            className={`task-tab ${activeTab === "logi" ? "active logi" : ""}`}
          >
            🔧 <span>LOGI</span>
          </div>
        </div>

        <div className="task-due">
          <span className="due-label">{dueLabel}</span>
          <span className="due-date">{dueDate}</span>
        </div>
      </div>
    </div>
  );
}
