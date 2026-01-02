// @ts-nocheck
import type { Project } from "@/lib/types/project";

export interface ProjectRecommendation {
  key: "label" | "upc" | "materials" | null;
  title: string;
  cta: string;
}

/**
 * Get the highest priority recommendation for a project based on missing required info.
 * Priority: 1) label photo, 2) UPC, 3) materials/dimensions
 */
export function getProjectRecommendation(
  project: Project
): ProjectRecommendation {
  const requiredInfo = project.requiredInfo;

  // Priority 1: Label photo missing
  if (!requiredInfo?.labelPhotoUrl) {
    return {
      key: "label",
      title: "Back label photo missing",
      cta: "Upload label photo",
    };
  }

  // Priority 2: UPC missing
  if (!requiredInfo?.upc) {
    return {
      key: "upc",
      title: "UPC not provided",
      cta: "Add UPC or barcode",
    };
  }

  // Priority 3: Materials missing
  if (!requiredInfo?.materialsAndDimensions) {
    return {
      key: "materials",
      title: "Specs missing",
      cta: "Add materials and dimensions",
    };
  }

  // All required info is present
  return {
    key: null,
    title: "",
    cta: "",
  };
}

