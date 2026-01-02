// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getMockProject, updateMockProject } from "@/lib/projects/mock";
import type { ProjectResponse, ProjectUpdateInput, ProjectActivity } from "@/lib/projects/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = getMockProject(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" } as ProjectResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    } as ProjectResponse);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } as ProjectResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body: ProjectUpdateInput = await request.json();

    const existingProject = getMockProject(projectId);
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: "Project not found" } as ProjectResponse,
        { status: 404 }
      );
    }

    // Merge requiredInfo if provided
    const updates: Partial<typeof existingProject> = {};
    const newActivities: ProjectActivity[] = [];
    
    if (body.requiredInfo) {
      updates.requiredInfo = {
        ...existingProject.requiredInfo,
        ...body.requiredInfo,
      };
      
      // Check if all required info is now complete
      const allInfoComplete = 
        updates.requiredInfo.labelPhotoUrl &&
        updates.requiredInfo.upc &&
        updates.requiredInfo.materialsAndDimensions;
      
      // If all info complete and status is still requested, optionally move to verifying
      if (allInfoComplete && existingProject.status === "requested") {
        updates.status = "verifying";
        
        // Set first milestone to active
        if (existingProject.verifyingMilestones) {
          updates.verifyingMilestones = existingProject.verifyingMilestones.map((m, i) => 
            i === 0 ? { ...m, status: "active" as const, updatedAt: new Date().toISOString() } : m
          );
        }
        
        newActivities.push({
          id: `act_${projectId}_${Date.now()}_status`,
          type: "note",
          message: "Status updated to Verifying",
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    if (body.status) {
      updates.status = body.status;
    }
    
    if (body.verifyingMilestones) {
      updates.verifyingMilestones = body.verifyingMilestones;
      
      // Add activity for milestone changes
      body.verifyingMilestones.forEach((milestone) => {
        if (milestone.status === "done" && milestone.updatedAt) {
          newActivities.push({
            id: `act_${projectId}_${Date.now()}_${milestone.key}`,
            type: "milestone",
            message: `${milestone.label} completed`,
            timestamp: milestone.updatedAt,
          });
        } else if (milestone.status === "active" && milestone.updatedAt) {
          newActivities.push({
            id: `act_${projectId}_${Date.now()}_${milestone.key}_active`,
            type: "milestone",
            message: `${milestone.label} started`,
            timestamp: milestone.updatedAt,
          });
        }
      });
    }
    
    if (body.activities) {
      newActivities.push(...body.activities);
    }

    const updatedProject = updateMockProject(projectId, {
      ...updates,
      activities: newActivities.length > 0 ? newActivities : undefined,
    });

    if (!updatedProject) {
      return NextResponse.json(
        { success: false, error: "Failed to update project" } as ProjectResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProject,
    } as ProjectResponse);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } as ProjectResponse,
      { status: 500 }
    );
  }
}
