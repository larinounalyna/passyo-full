import React from "react";
import "./ResourceHubToggle.css";

export default function ResourceHubToggle({ activeToggle, setActiveToggle }) {
  return (
    <ul className="resource-hub-toggle">
      <li
        onClick={() => setActiveToggle(0)}
        className={activeToggle === 0 ? "active" : ""}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        Materials
      </li>

      <li
        onClick={() => setActiveToggle(1)}
        className={activeToggle === 1 ? "active" : ""}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Hr/Crew
      </li>

      <li
        onClick={() => setActiveToggle(2)}
        className={activeToggle === 2 ? "active" : ""}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        Equipment
      </li>
    </ul>
  );
}
