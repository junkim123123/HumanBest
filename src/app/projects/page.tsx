"use client";

import { useState, useEffect } from "react";
import { PrimaryNav } from "@/components/PrimaryNav";
import { ProjectList } from "@/components/projects/ProjectList";
import { SLA_DESCRIPTION, SLA_UPDATE } from "@/lib/copy";
import { getProjects, updateProject } from "@/lib/storage/projects";

export default function ProjectsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Demo status progression: update "verifying" projects to "quoted" after 10 seconds
  useEffect(() => {
    const projects = getProjects();
    const verifyingProjects = projects.filter((p) => p.status === "verifying");

    if (verifyingProjects.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      verifyingProjects.forEach((project) => {
        updateProject(project.id, { status: "quoted" });
      });
      setRefreshKey((k) => k + 1);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [refreshKey]);

  const handleProjectUpdate = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PrimaryNav />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Projects</h1>
          <p className="text-slate-600 mb-1">{SLA_DESCRIPTION}</p>
          <p className="text-xs text-slate-500">{SLA_UPDATE}</p>
        </div>

        {/* Project list */}
        <ProjectList key={refreshKey} onProjectUpdate={handleProjectUpdate} />
      </div>
    </div>
  );
}

