"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This static route is now deprecated in favor of /projects/[projectId].
 * We redirect to /projects so users can select a specific project to view.
 * This prevents the "useProject must be used within a ProjectProvider" error.
 */
export default function ProjectDetailsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projects");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
