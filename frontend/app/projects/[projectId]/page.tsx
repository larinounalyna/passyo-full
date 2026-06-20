"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectProvider } from "@/lib/context/ProjectContext";
import ProjectDetailsContent from "../project-details/ProjectDetailsContent";

export default function DynamicProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.projectId as string);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/authentication/login");
      }
    }
  }, [router]);

  if (isNaN(projectId)) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
        Invalid Project ID
      </div>
    );
  }

  return (
    <ProjectProvider projectId={projectId}>
      <ProjectDetailsContent />
    </ProjectProvider>
  );
}
