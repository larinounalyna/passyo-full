import React from "react";
import "../css/HeadingSection.css";

export default function HeadingSection() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="heading-section">
      <div className="heading-text">
        <p>{today}</p>
      </div>
    </div>
  );
}
