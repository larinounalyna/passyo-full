import React, { useState } from "react";
import "./ResourceHubPage.css";
import ResourceHeading from "./ResourceHubHeading/ResourceHubHeading.jsx";
import ResourceHubToggle from "./ResourceHubToggle/ResourceHubToggle.jsx";
import ResourceManagementTable from "./ResourcesManagementTable/ResourceManagementTable.jsx";
import MaterialTable from "./MaterialTable/MaterialTable.jsx";
import CrewTable from "./crewhrmanagement/crewmanagementtable.jsx";

export default function ResourceHubPage() {
  const [activeToggle, setActiveToggle] = useState(0);

  return (
    <div className="Resource-hub-page">
      {/* Tabs sit directly on top of the panel — no gap */}
      <ResourceHubToggle
        activeToggle={activeToggle}
        setActiveToggle={setActiveToggle}
      />

      {/* Panel with matching calendar card style */}
      <div className="resource-hub-panel">
        {activeToggle === 0 && <MaterialTable />}
        {activeToggle === 1 && <CrewTable />}
        {activeToggle === 2 && <ResourceManagementTable />}
      </div>
    </div>
  );
}
