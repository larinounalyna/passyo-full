"use client";

import "./page.css";
import { useState } from "react";
import CurrentState from "./current-state/current-state";
import PageNavigationList from "@/components/page_navigation/page_navigation";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import ResourceHubPage from "./ResourceHub/ResourceHubPage";
import ReportsPage from "./reports/ReportsPage";
import ScheduleModule from "./schedule/schedule";
import SuiviTab from "./suivi/SuiviTab";
import PlanningPage from "./planning/PlanningPage";
import { useProject } from "@/lib/context/ProjectContext";

function handleNavigation(index: number) {
  if (index === 0) {
    return <CurrentState />;
  } else if (index === 1) {
    return <PlanningPage />;
  } else if (index === 2) {
    return <ReportsPage />;
  } else if (index === 3) {
    return (
      <div>
        <ResourceHubPage />
      </div>
    );
  } else if (index === 4) {
    return <ScheduleModule />;
  } else if (index === 5) {
    return <SuiviTab />;
  }
}

export default function ProjectDetailsContent() {
  const { project, loading, error } = useProject();
  const [activePage, setActivePage] = useState(0);

  const handlePageClick = (index: number) => {
    setActivePage(index);
  };

  if (loading) {
    return (
      <div className="project-details-shell app-shell">
        <Sidebar />
        <div className="project-details-content app-content flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-details-shell app-shell">
        <Sidebar />
        <div className="project-details-content app-content flex flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-semibold text-red-500">Error</h2>
          <p className="text-gray-600">{error || "Project not found"}</p>
        </div>
      </div>
    );
  }

  const memberInitials = (project.members ?? []).slice(0, 3).map((m) => {
    const first = m.name?.charAt(0) || "";
    const last = m.family_name?.charAt(0) || m.username?.charAt(0) || "";
    return (first + last).toUpperCase();
  });

  const extraCount = Math.max(0, (project.members ?? []).length - 3);

  return (
    <div className="project-details-shell app-shell">
      <Sidebar />
      <div className="project-details-content app-content">
        <div className="project-details-header page-header-block">
          <PageTitle
            title={project.name || "Untitled Project"}
            precedingTitle={[{ label: "Projects", href: "/projects" }]}
          />
        </div>

        <div className="project-details-page">
          <div className="project-details-navigation-row">
            <PageNavigationList
              pageList={[
                { pageName: "Current State", pageref: 0 },
                { pageName: "Planning", pageref: 1 },
                { pageName: "Reports", pageref: 2 },
                { pageName: "Resources", pageref: 3 },
                { pageName: "Schedule", pageref: 4 },
                { pageName: "Suivi", pageref: 5 },
              ]}
              activePage={activePage}
              onPageClick={handlePageClick}
            />

            <div
              className="project-people-actions"
              aria-label="Project team actions"
            >
              <div className="project-team-avatars" aria-hidden="true">
                {memberInitials.map((initials, idx) => (
                  <span key={idx} className="project-avatar-chip">
                    {initials}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="project-avatar-chip extra">
                    +{extraCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          {handleNavigation(activePage)}
        </div>
      </div>
    </div>
  );
}
