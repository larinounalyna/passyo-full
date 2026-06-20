"use client";

import { useMemo, useState } from "react";
import CreateProjectButton from "@/components/create_project_button/create_projectbutton";
import "./page.css";
import PageTitle from "@/components/page_title/page_title";
import PageNavigationList from "@/components/page_navigation/page_navigation";
import Sidebar from "@/components/sidebar/sidebar";
import SearchBar from "@/components/search-bar/search-bar";
import PageSection from "@/components/page_section/page_section";
import ReadyTemplateCards from "@/components/ready_template_cards/ready_template_cards";
import ProjectCard from "@/components/project_card/project_card";
import { PROJECTS } from "@/lib/mock/data";

type Project = {
  id: number;
  name: string;
  description: string;
  status: string;
  members?: string[];
  progress?: number;
  team?: string;
  location?: string;
  dueIn?: string;
};

const MOCK_PROJECTS: Project[] = PROJECTS.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  status: p.status,
  members: [],
  progress: p.progress,
  team: p.team,
  location: p.location,
  dueIn: p.dueIn,
}));

function EmptyProjects({ onCreated }: { onCreated: () => void }) {
  return (
    <div>
      <div className="projects-empty">
        <h2>Aucun projet</h2>
        <p>
          Cette page affichera vos projets une fois créés ou partagés avec vous.
        </p>
        <CreateProjectButton onCreated={onCreated} />
      </div>
      <PageSection sectionName="Modèles prêts à l'emploi" />
      <div className="projects-templates">
        {[1, 2, 3].map((i) => (
          <ReadyTemplateCards
            key={i}
            projectName="Modèle de gestion de projet"
            projectDescription="Démarrez votre projet avec notre modèle complet de gestion de chantier."
            projecticon="/file.svg"
          />
        ))}
      </div>
    </div>
  );
}

function ProjectsList({
  projectList = [],
  hasProjects = true,
  onCreated,
}: {
  projectList?: Project[];
  hasProjects?: boolean;
  onCreated: () => void;
}) {
  if (!hasProjects) return <EmptyProjects onCreated={onCreated} />;
  return (
    <div>
      <div className="projects-header-actions">
        <CreateProjectButton onCreated={onCreated} />
      </div>
      <div className="projects-grid">
        {projectList.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}

function Projects() {
  const [activePage, setActivePage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    let result = MOCK_PROJECTS;
    if (activePage === 1)
      result = result.filter((p) =>
        ["active", "on_track", "risk"].includes(p.status),
      );
    if (activePage === 2)
      result = result.filter((p) => p.status === "completed");
    const q = searchQuery.trim().toLowerCase();
    if (q)
      result = result.filter((p) =>
        [p.name, p.description, p.status].join(" ").toLowerCase().includes(q),
      );
    return result;
  }, [searchQuery, activePage]);

  return (
    <div className="projects-page-shell app-shell">
      <Sidebar />
      <div className="projects-content app-content">
        <div className="page-header-block">
          <PageTitle title="Projets" />
          <div className="projects-header-navigation flex items-center justify-between w-full mt-4">
            <div className="project-navigation flex-1">
              <PageNavigationList
                pageList={[
                  { pageName: "Tous les projets", pageref: 0 },
                  { pageName: "En cours", pageref: 1 },
                  { pageName: "Terminés", pageref: 2 },
                ]}
                activePage={activePage}
                onPageClick={setActivePage}
              />
            </div>
            <div className="search-wrapper ml-4">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
        </div>
        <ProjectsList
          projectList={filteredProjects}
          hasProjects={MOCK_PROJECTS.length > 0}
          onCreated={() => {}}
        />
      </div>
    </div>
  );
}

export default Projects;
