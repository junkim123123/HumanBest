// @ts-nocheck
"server-only";

/**
 * Re-export from shared module for server code compatibility
 * Server code should import from shared, but this maintains backward compatibility
 */
export {
  inferCompanyType,
  shouldExcludeCompanyType,
  getExclusionReason,
  type CompanyType,
} from "@/lib/shared/company-type-heuristic";

