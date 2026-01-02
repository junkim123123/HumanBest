// @ts-nocheck
// ============================================================================
// Golden Fixtures - Contract Test Data
// ============================================================================

import type { Report } from "./types";
import { getMockReport } from "./mock";
import { validateReport } from "./validation";

/**
 * Get all golden fixtures for contract testing
 * These fixtures must always pass validation
 */
export function getGoldenFixtures(): Report[] {
  const fixtureIds = ["toy-example", "line-friends-jelly"];
  const fixtures: Report[] = [];

  for (const id of fixtureIds) {
    const report = getMockReport(id);
    if (report) {
      fixtures.push(report);
    }
  }

  return fixtures;
}

/**
 * Validate all golden fixtures
 * Throws if any fixture fails validation
 */
export function validateGoldenFixtures(): void {
  const fixtures = getGoldenFixtures();

  for (const fixture of fixtures) {
    try {
      validateReport(fixture);
    } catch (error) {
      throw new Error(
        `Golden fixture ${fixture.id} failed validation: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

/**
 * Export fixtures as JSON for external testing
 */
export function exportFixturesAsJSON(): string {
  const fixtures = getGoldenFixtures();
  return JSON.stringify(fixtures, null, 2);
}














