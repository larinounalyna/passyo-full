import React from "react";
import PropTypes from "prop-types";
import "../css/ToDocards.css";

export default function ToDoCards({
  wo = "#WO-4022",
  badge = "DELIVERY",
  title = "Grade 80 Rebar Delivery",
  description = "5 tons scheduled for West Gate. Coordinate with site security for unloading.",
  location = "West Gate - Zone A",
  rightIcon = "HOT",
  onMove,
  moveLabel = "Move"
}) {
  return (
    <div className="wo-card">
      <div className="wo-top">
        <span className="wo-id">{wo}</span>
        <span className="wo-badge">{badge}</span>
      </div>

      <h3 className="wo-title">{title}</h3>
      <p className="wo-desc">{description}</p>

      <div className="wo-divider" />

      <div className="wo-bottom">
        <div className="wo-location">
          <span className="wo-pin" aria-hidden="true">
            ⦿
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

ToDoCards.propTypes = {
  wo: PropTypes.string,
  badge: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  location: PropTypes.string,
  rightIcon: PropTypes.node,
};
