// @ts-nocheck
// ============================================================================
// Project Mock Data
// ============================================================================

import type { Project, ProjectStatus, VerifyingMilestone, ProjectActivity } from "./types";

// In-memory store for demo (replace with DB later)
const projectsStore = new Map<string, Project>();

const createInitialMilestones = (): VerifyingMilestone[] => [
  {
    key: "evidence_sweep",
    label: "Evidence sweep",
    status: "pending",
    updatedAt: null,
  },
  {
    key: "factory_outreach",
    label: "Factory outreach",
    status: "pending",
    updatedAt: null,
  },
  {
    key: "quote_confirmation",
    label: "Quote confirmation",
    status: "pending",
    updatedAt: null,
  },
];

const createInitialActivities = (projectId: string): ProjectActivity[] => {
  const now = new Date().toISOString();
  return [
    {
      id: `act_${projectId}_${Date.now()}_1`,
      type: "system",
      message: "Verification started",
      timestamp: now,
    },
    {
      id: `act_${projectId}_${Date.now()}_2`,
      type: "system",
      message: "Request created",
      timestamp: now,
    },
  ];
};

export function createMockProject(
  id: string,
  reportId: string,
  request: Project["request"],
  depositStatus: Project["depositStatus"] = "paid_mock"
): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id,
    reportId,
    status: "requested",
    request,
    depositAmount: 45,
    depositCurrency: "USD",
    depositStatus,
    depositCreditedAt: null,
    requiredInfo: {
      labelPhotoUrl: null,
      upc: null,
      materialsAndDimensions: null,
    },
    verifyingMilestones: createInitialMilestones(),
    activities: createInitialActivities(id),
    createdAt: now,
    updatedAt: now,
  };
  projectsStore.set(id, project);
  return project;
}

export function getMockProject(id: string): Project | null {
  return projectsStore.get(id) || null;
}

export function updateMockProjectStatus(
  id: string,
  status: ProjectStatus
): Project | null {
  const project = projectsStore.get(id);
  if (!project) return null;
  
  const updated = {
    ...project,
    status,
    updatedAt: new Date().toISOString(),
  };
  projectsStore.set(id, updated);
  return updated;
}

export function getMockProjectsByReportId(reportId: string): Project[] {
  return Array.from(projectsStore.values()).filter(
    (p) => p.reportId === reportId
  );
}

export function updateMockProject(
  id: string,
  updates: Partial<Project>
): Project | null {
  const project = projectsStore.get(id);
  if (!project) return null;
  
  // Handle activities array merge
  let mergedActivities = project.activities || [];
  if (updates.activities) {
    mergedActivities = [...mergedActivities, ...updates.activities];
  }
  
  const updated = {
    ...project,
    ...updates,
    activities: mergedActivities.length > 0 ? mergedActivities : project.activities,
    updatedAt: new Date().toISOString(),
  };
  projectsStore.set(id, updated);
  return updated;
}

// Initialize with sample projects
export function initializeMockProjects() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setHours(yesterday.getHours() - 24);
  
  // Project 1: Requested status
  const requestedId = "proj_requested_001";
  if (!projectsStore.has(requestedId)) {
    createMockProject(
      requestedId,
      "toy-example",
      {
        targetMoq: 1000,
        incoterms: "FOB",
        shippingMode: "OceanFreight",
        deadlineDays: 14,
        contactEmail: "buyer@example.com",
      },
      "paid_mock"
    );
  }
  
  // Project 2: Verifying status with progress
  const verifyingId = "proj_verifying_001";
  if (!projectsStore.has(verifyingId)) {
    const verifyingProject = createMockProject(
      verifyingId,
      "line-friends-jelly",
      {
        targetMoq: 5000,
        incoterms: "CIF",
        shippingMode: "AirFreight",
        deadlineDays: 7,
        contactEmail: "buyer2@example.com",
      },
      "paid_mock"
    );
    
    // Update to verifying status with milestones
    const milestones: VerifyingMilestone[] = [
      {
        key: "evidence_sweep",
        label: "Evidence sweep",
        status: "done",
        updatedAt: yesterday.toISOString(),
      },
      {
        key: "factory_outreach",
        label: "Factory outreach",
        status: "active",
        updatedAt: new Date(yesterday.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        key: "quote_confirmation",
        label: "Quote confirmation",
        status: "pending",
        updatedAt: null,
      },
    ];
    
    const activities: ProjectActivity[] = [
      ...verifyingProject.activities!,
      {
        id: `act_${verifyingId}_${Date.now()}_3`,
        type: "milestone",
        message: "Evidence sweep completed",
        timestamp: yesterday.toISOString(),
      },
      {
        id: `act_${verifyingId}_${Date.now()}_4`,
        type: "milestone",
        message: "Factory outreach started",
        timestamp: new Date(yesterday.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `act_${verifyingId}_${Date.now()}_5`,
        type: "note",
        message: "Contacted 3 factories, awaiting responses",
        timestamp: new Date(yesterday.getTime() + 18 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    updateMockProject(verifyingId, {
      status: "verifying",
      verifyingMilestones: milestones,
      activities,
    });
  }
}

