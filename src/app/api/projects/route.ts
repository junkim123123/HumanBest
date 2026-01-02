// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createMockProject, initializeMockProjects } from "@/lib/projects/mock";
import type { ProjectCreateInput, ProjectCreateResponse } from "@/lib/projects/types";

// Initialize mock projects on module load
initializeMockProjects();

export async function POST(request: NextRequest) {
  try {
    const body: ProjectCreateInput = await request.json();

    // Validation
    if (!body.reportId || !body.request) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" } as ProjectCreateResponse,
        { status: 400 }
      );
    }

    const { reportId, request: projectRequest } = body;

    if (
      !projectRequest.targetMoq ||
      !projectRequest.incoterms ||
      !projectRequest.shippingMode ||
      !projectRequest.deadlineDays ||
      !projectRequest.contactEmail
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required request fields" } as ProjectCreateResponse,
        { status: 400 }
      );
    }

    // Generate deterministic project ID (replace with DB-generated ID later)
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create project with deposit status from body (default to paid_mock for simulated payment)
    const depositStatus = (body as any).depositStatus || "paid_mock";
    const project = createMockProject(projectId, reportId, projectRequest, depositStatus);

    return NextResponse.json({
      ok: true,
      projectId: project.id,
    } as ProjectCreateResponse);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } as ProjectCreateResponse,
      { status: 500 }
    );
  }
}

