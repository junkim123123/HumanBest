/**
 * Build deterministic evidence sentence for supplier leads
 * Returns one sentence explaining why this lead appears
 */
export function buildLeadEvidenceSentence(
  match: any,
  intel: any,
  reportContext: any
): string {
  const flags = match.flags || {};
  const evidence = match.evidence || {};
  const supplierType = match.role || match._profile?.role || flags.type || "unknown";
  const isLogistics = supplierType === "logistics" || flags.type_logistics || false;
  
  // Get similar records count from report context or match
  const similarRecordsCount = reportContext?.similarRecordsCount || 
                             evidence?.similarRecordsCount || 
                             evidence?.recordCount || 
                             flags?.similar_overlap_count || 
                             0;
  
  // Get anchor hits
  const anchorHits = flags.anchor_hit || 
                    (typeof evidence.anchorHits === 'number' ? evidence.anchorHits : 0) ||
                    flags.anchor_hit_count || 
                    0;
  
  // Get matched anchor examples (up to 2, from flags.matched_anchors)
  const matchedAnchors = (flags.matched_anchors as string[]) || [];
  const anchorExamples = matchedAnchors
    .slice(0, 2)
    .map(anchor => anchor.length > 24 ? anchor.substring(0, 21) + "..." : anchor);
  
  // Category alignment
  const isCategoryAligned = flags.category_hit || evidence.categoryMatch || false;
  
  // Supplier data
  const shipmentCount = match.shipment_count_12m || intel?.records_count || null;
  const lastSeenDate = match.last_seen_date || intel?.last_seen_at || null;
  const lastSeenFormatted = lastSeenDate 
    ? new Date(lastSeenDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
  
  // RISK OVERRIDE: If logistics, prefix with warning
  if (isLogistics) {
    let baseReason = "";
    
    // Find best available reason fragment
    if (similarRecordsCount > 0) {
      baseReason = `matched to ${similarRecordsCount} similar US import${similarRecordsCount === 1 ? "" : "s"}`;
    } else if (anchorHits > 0) {
      baseReason = `keyword match, ${anchorHits} anchor${anchorHits === 1 ? "" : "s"}`;
      // Append matched anchor examples if available
      if (anchorExamples.length > 0) {
        baseReason += ` (${anchorExamples.join(", ")})`;
      }
    } else if (isCategoryAligned) {
      baseReason = "category aligned";
    } else {
      baseReason = "category based inference";
    }
    
    return `Logistics suspected, not a manufacturer lead. ${baseReason}.`;
  }
  
  // PRIORITY A: Similar records
  if (similarRecordsCount > 0) {
    const parts: string[] = [];
    
    if (shipmentCount !== null && shipmentCount > 0) {
      parts.push(`Matched to ${similarRecordsCount} similar US import${similarRecordsCount === 1 ? "" : "s"}, supplier seen ${shipmentCount} time${shipmentCount === 1 ? "" : "s"}`);
    } else {
      parts.push(`Matched to ${similarRecordsCount} similar US import${similarRecordsCount === 1 ? "" : "s"}`);
    }
    
    if (lastSeenFormatted) {
      parts.push(`last seen ${lastSeenFormatted}`);
    }
    
    return parts.join(", ") + ".";
  }
  
  // PRIORITY A (alternative): Intel records count
  if (intel?.records_count && intel.records_count > 0) {
    const parts: string[] = [];
    parts.push(`Supplier appears in ${intel.records_count} record${intel.records_count === 1 ? "" : "s"}`);
    
    if (lastSeenFormatted) {
      parts.push(`last seen ${lastSeenFormatted}`);
    }
    
    return parts.join(", ") + ".";
  }
  
  // PRIORITY B: Anchor hits
  if (anchorHits > 0) {
    let anchorText = `Keyword match, ${anchorHits} anchor${anchorHits === 1 ? "" : "s"}`;
    
    // Append matched anchor examples if available
    if (anchorExamples.length > 0) {
      anchorText += ` (${anchorExamples.join(", ")})`;
    }
    
    if (isCategoryAligned) {
      anchorText += ", category aligned";
    }
    
    return anchorText + ".";
  }
  
  // PRIORITY B (alternative): Category aligned
  if (isCategoryAligned) {
    const productCount = intel?.product_count || match.product_count || 0;
    if (productCount > 0) {
      return `Category aligned, dataset shows ${productCount} related product${productCount === 1 ? "" : "s"}.`;
    } else {
      return "Category aligned, dataset shows related products.";
    }
  }
  
  // PRIORITY C: Fallback
  return "Category based inference, dataset has limited history.";
}

/**
 * Build coverage line with compact chips
 * Returns array of chip strings (only when data exists)
 */
export function buildCoverageLine(match: any, intel: any): string[] {
  const chips: string[] = [];
  
  // Products count
  const productCount = intel?.product_count || match.product_count || null;
  if (productCount !== null && productCount > 0) {
    chips.push(`Products ${productCount}`);
  }
  
  // Pricing coverage
  const coveragePercent = intel?.price_coverage_pct || null;
  if (coveragePercent !== null && coveragePercent > 0) {
    chips.push(`Pricing coverage ${Math.round(coveragePercent)}%`);
  } else if (coveragePercent !== null && coveragePercent === 0) {
    chips.push("No pricing in dataset");
  }
  
  // Price range
  const priceMin = intel?.price_min || match.price_min || null;
  const priceMax = intel?.price_max || match.price_max || null;
  if (priceMin !== null && priceMax !== null && priceMin > 0 && priceMax > 0) {
    const unit = match.currency || intel?.currency || "USD";
    chips.push(`Price range $${priceMin.toFixed(2)} to $${priceMax.toFixed(2)} ${unit}`);
  }
  
  // Top HS code
  const topHsCodes = intel?.top_hs_codes || match.top_hs_codes || [];
  if (topHsCodes && topHsCodes.length > 0) {
    const topHs = topHsCodes[0];
    if (topHs && topHs !== "00000000") {
      chips.push(`Top HS ${topHs}`);
    }
  }
  
  // Last seen
  const lastSeenDate = match.last_seen_date || intel?.last_seen_at || null;
  if (lastSeenDate) {
    const lastSeenFormatted = new Date(lastSeenDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    chips.push(`Last seen ${lastSeenFormatted}`);
  }
  
  return chips;
}

/**
 * Build "Why this lead" bullets for expanded view
 */
export function buildWhyThisLeadBullets(
  match: any,
  intel: any,
  reportContext: any
): string[] {
  const bullets: string[] = [];
  const flags = match.flags || {};
  const evidence = match.evidence || {};
  
  // Similar imports match count
  const similarRecordsCount = reportContext?.similarRecordsCount || 
                             evidence?.similarRecordsCount || 
                             evidence?.recordCount || 
                             flags?.similar_overlap_count || 
                             0;
  if (similarRecordsCount > 0) {
    bullets.push(`${similarRecordsCount} similar import${similarRecordsCount === 1 ? "" : "s"} matched in US customs records`);
  }
  
  // Anchor keyword hit count
  const anchorHits = flags.anchor_hit || 
                    (typeof evidence.anchorHits === 'number' ? evidence.anchorHits : 0) ||
                    flags.anchor_hit_count || 
                    0;
  if (anchorHits > 0) {
    const matchedAnchors = (flags.matched_anchors as string[]) || [];
    const anchorExamples = matchedAnchors
      .slice(0, 2)
      .map(anchor => anchor.length > 24 ? anchor.substring(0, 21) + "..." : anchor);
    
    let anchorText = `${anchorHits} anchor keyword${anchorHits === 1 ? "" : "s"} matched in product descriptions`;
    if (anchorExamples.length > 0) {
      anchorText += ` (${anchorExamples.join(", ")})`;
    }
    bullets.push(anchorText);
  }
  
  // Category alignment
  const isCategoryAligned = flags.category_hit || evidence.categoryMatch || false;
  if (isCategoryAligned) {
    bullets.push("Category alignment with product classification");
  }
  
  // Dataset coverage summary
  const productCount = intel?.product_count || match.product_count || 0;
  const recordsCount = intel?.records_count || match.shipment_count_12m || 0;
  if (productCount > 0 || recordsCount > 0) {
    const parts: string[] = [];
    if (productCount > 0) {
      parts.push(`${productCount} product${productCount === 1 ? "" : "s"}`);
    }
    if (recordsCount > 0) {
      parts.push(`${recordsCount} record${recordsCount === 1 ? "" : "s"}`);
    }
    if (parts.length > 0) {
      bullets.push(`Dataset coverage: ${parts.join(", ")}`);
    }
  }
  
  // Clear missing item line
  const hasPrice = intel?.price_coverage_pct && intel.price_coverage_pct > 0;
  const hasPricingData = intel?.price_min || intel?.price_max || match.unit_price;
  
  if (!hasPrice && !hasPricingData) {
    bullets.push("Pricing not collected, needs outreach");
  } else if (!hasPrice) {
    bullets.push("Pricing coverage incomplete, needs outreach");
  }
  
  // If no bullets were added, add a fallback
  if (bullets.length === 0) {
    bullets.push("Category inference based on limited dataset history");
  }
  
  return bullets;
}

