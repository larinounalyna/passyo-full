"use client";

import { useState } from "react";
import "./ReportsHub.css";
import ReportsHubToggle from "./reports-hub-toggle/ReportsHubToggle.jsx";
import DailyReportsPage from "./daily-reports/DailyReportsPage";
import AttachmentsPanel from "./attachments/AttachmentsPanel";
import AvenantsPanel from "./avenants/AvenantsPanel";
import SituationsPanel from "./situations/SituationsPanel";

function ReportsPage() {
  const [activeToggle, setActiveToggle] = useState(0);

  return (
    <div className="reports-hub-page">
      <ReportsHubToggle activeToggle={activeToggle} setActiveToggle={setActiveToggle} />

      <div className="reports-hub-panel">
        {activeToggle === 0 && <DailyReportsPage />}
        {activeToggle === 1 && <AttachmentsPanel />}
        {activeToggle === 2 && <AvenantsPanel />}
        {activeToggle === 3 && <SituationsPanel />}
      </div>
    </div>
  );
}

export default ReportsPage;
