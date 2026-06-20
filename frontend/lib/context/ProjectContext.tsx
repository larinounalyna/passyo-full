"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getProject, ProjectOut } from "@/lib/api/projects";

export type ProjectWithMembers = ProjectOut & { members?: ProjectMember[] };
export interface ProjectMember { id: number; user_id?: number; name?: string; family_name?: string; username?: string; email?: string; }

interface ProjectContextType {
  project: ProjectWithMembers | null;
  loading: boolean;
  error: string | null;
  refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ projectId, children }: { projectId: number; children: React.ReactNode }) {
  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject({ ...data, members: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [projectId]);

  return (
    <ProjectContext.Provider value={{ project, loading, error, refreshProject: fetchProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
