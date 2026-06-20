import React from "react";
import "./memberinfo.css";

export default function MemberInfo({ member, onClose }) {
  if (!member) return null;

  return (
    <div className={`member-info-panel ${member ? "open" : ""}`}>
      <div className="member-info-header">
        <div className="member-profile">
          <div className="member-avatar-large">{member.name.charAt(0)}</div>
          <div className="member-header-info">
            <div className="member-header-name">{member.name}</div>
            <div className="member-header-role">{member.role}</div>
          </div>
        </div>
        <button className="close-panel-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="member-info-content">
        {/* Assigned Task Section */}
        <div className="member-info-section">
          <div className="section-header">
            <div className="section-title">ASSIGNED TASK</div>
            <div className="edit-link">EDIT</div>
          </div>
          <div className="task-card">
            <div className="task-title-row">
              <div className="task-title">{member.project}</div>
              <div className="phase-badge">{member.phase || "PHASE 2"}</div>
            </div>
            <div className="task-description">
              Responsible for main structural joints reinforcement on Floor
              12-14.
            </div>
            <div className="task-meta">
              <div className="task-meta-item">
                <div className="meta-label">DUE DATE</div>
                <div className="meta-value">Oct 24, 2023</div>
              </div>
              <div className="task-meta-item">
                <div className="meta-label">SUPERVISOR</div>
                <div className="meta-value">R. Peterson</div>
              </div>
            </div>
          </div>
        </div>

        {/* Private Notes Section */}
        <div className="member-info-section">
          <div className="section-header">
            <div className="section-title">PRIVATE NOTES</div>
          </div>
          <textarea
            className="notes-textarea"
            placeholder="Add internal observations, performance notes, or follow-ups..."
          />
          <button className="save-note-btn">SAVE NOTE</button>
          <div style={{ clear: "both", marginTop: "16px" }}>
            <div className="note-item">
              <div className="note-text">
                Requested a safety harness upgrade last week. Equipment team
                notified.
              </div>
              <div className="note-meta">Oct 18, 2023 • By A. Rodriguez</div>
            </div>
          </div>
        </div>

        {/* Activity & Media History Section */}
        <div className="member-info-section">
          <div className="section-header">
            <div className="section-title">ACTIVITY & MEDIA HISTORY</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <svg viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </div>
            <div className="activity-content">
              <div className="activity-title">Safety Checklist Completed</div>
              <div className="activity-description">
                Completed pre-shift inspection for Welding Rig #04.
              </div>
              <div className="activity-time">2h ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
