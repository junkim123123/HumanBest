// @ts-nocheck
import type { Project, ProjectActivity } from "@/lib/types/project";

const STORAGE_KEY = "nexsupply_projects_v1";

export function getProjects(): Project[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate each project has required fields
    return parsed.filter((p: any) => {
      return (
        p &&
        typeof p.id === "string" &&
        typeof p.reportId === "string" &&
        typeof p.productName === "string" &&
        typeof p.createdAt === "string" &&
        typeof p.status === "string" &&
        typeof p.depositStatus === "string" &&
        p.quotesSummary &&
        typeof p.quotesSummary.suppliersCount === "number"
      );
    }).map((p: any) => ({
      ...p,
      activities: p.activities || [],
      lastActivityAt: p.lastActivityAt || undefined,
      requiredInfo: p.requiredInfo || undefined,
    })) as Project[];
  } catch (error) {
    console.error("[Projects Storage] Failed to parse projects:", error);
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("[Projects Storage] Failed to save projects:", error);
  }
}

export interface CreateProjectInput {
  reportId: string;
  productName: string;
}

export function createProject(input: CreateProjectInput): Project {
  const projects = getProjects();

  const newProject: Project = {
    id: `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    reportId: input.reportId,
    productName: input.productName,
    createdAt: new Date().toISOString(),
    status: "requested",
    depositStatus: "received",
    quotesSummary: {
      suppliersCount: 3,
      priceRange: "TBD",
      leadTime: "TBD",
    },
  };

  projects.push(newProject);
  saveProjects(projects);

  return newProject;
}

export interface UpdateProjectPatch {
  status?: Project["status"];
  quotesSummary?: Partial<Project["quotesSummary"]>;
}

export function updateProject(
  id: string,
  patch: UpdateProjectPatch
): Project | null {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return null;
  }

  const updated = {
    ...projects[index],
    ...patch,
    quotesSummary: patch.quotesSummary
      ? { ...projects[index].quotesSummary, ...patch.quotesSummary }
      : projects[index].quotesSummary,
  };

  projects[index] = updated;
  saveProjects(projects);

  return updated;
}

export interface ProjectActivityInput {
  type: ProjectActivity["type"];
  message: string;
  meta?: ProjectActivity["meta"];
}

export interface UpdateProjectMilestonePatch {
  milestoneKey: string;
  status: "pending" | "active" | "done";
}

/**
 * Append an activity to a project
 */
export function appendProjectActivity(
  projectId: string,
  activity: ProjectActivityInput
): Project | null {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === projectId);

  if (index === -1) {
    return null;
  }

  const project = projects[index];
  const now = new Date().toISOString();

  const newActivity: ProjectActivity = {
    id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: activity.type,
    message: activity.message,
    timestamp: now,
    meta: activity.meta,
  };

  const activities = project.activities || [];
  activities.push(newActivity);

  const updated: Project = {
    ...project,
    activities,
    lastActivityAt: now,
  };

  projects[index] = updated;
  saveProjects(projects);

  return updated;
}

/**
 * Find the latest project matching a reportId
 */
export function findLatestProjectByReportId(reportId: string): Project | null {
  const projects = getProjects();
  const matching = projects.filter((p) => p.reportId === reportId);
  
  if (matching.length === 0) {
    return null;
  }

  // Sort by createdAt descending and return the latest
  matching.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return matching[0];
}

/**
 * Update project milestones when outreach starts
 * If verifyingMilestones exist:
 * - Set evidence_sweep to "done" if not already
 * - Set factory_outreach to "active" if not already
 * - Append milestone activity "Factory outreach in progress"
 */
export function updateProjectMilestonesForOutreach(projectId: string): Project | null {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === projectId);

  if (index === -1) {
    return null;
  }

  const project = projects[index];
  const now = new Date().toISOString();
  const activities = project.activities || [];

  // Check if we already have a factory outreach milestone activity
  const hasOutreachMilestone = activities.some(
    (a) => a.type === "milestone" && a.message.includes("Factory outreach")
  );

  // Only add milestone activity if this is the first outreach
  if (!hasOutreachMilestone) {
    const milestoneActivity: ProjectActivity = {
      id: `activity_${Date.now()}_milestone_${Math.random().toString(36).substring(2, 9)}`,
      type: "milestone",
      message: "Factory outreach in progress",
      timestamp: now,
    };

    activities.push(milestoneActivity);

    const updated: Project = {
      ...project,
      activities,
      lastActivityAt: now,
    };

    projects[index] = updated;
    saveProjects(projects);

    return updated;
  }

  return project;
}

