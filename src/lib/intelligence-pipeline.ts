import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IntelligencePipelineParams {
  imageUrl: string;
  quantity: number;
  dutyRate: number; // decimal (e.g., 0.15 for 15%)
  shippingCost: number;
  fee: number;
  productId?: string; // Optional: if updating existing product
}

export interface ImageAnalysisResult {
  productName: string;
  description: string;
  category: string;
  hsCode: string | null; // Harmonized System Code
  attributes: Record<string, string>;
  keywords: string[];
  confidence: number; // 0-1
}

export interface SupplierMatch {
  supplierId: string;
  supplierName: string;
  productName: string;
  unitPrice: number;
  moq: number; // Minimum Order Quantity
  leadTime: number; // days
  matchScore: number; // 0-100
  matchReason: string; // Why this match was made (HS Code, keyword, etc.)
  importKeyId: string | null;
  currency: string;
}

export interface LandedCost {
  unitPrice: number;
  dutyRate: number;
  shippingCost: number;
  fee: number;
  totalLandedCost: number;
  formula: string;
  breakdown: {
    baseUnitPrice: number;
    dutyAmount: number;
    shippingPerUnit: number;
    feePerUnit: number;
  };
}

export interface IntelligencePipelineResult {
  productId: string;
  analysis: ImageAnalysisResult;
  supplierMatches: SupplierMatch[];
  landedCosts: Array<{
    match: SupplierMatch;
    landedCost: LandedCost;
  }>;
  cached: {
    analysis: boolean;
    matches: boolean;
  };
  timestamp: string;
}

export interface CachedAnalysis {
  id: string;
  product_id: string;
  image_url: string;
  image_hash: string | null;
  product_name: string;
  description: string;
  category: string;
  hs_code: string | null;
  attributes: Record<string, string>;
  keywords: string[];
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface CachedSupplierMatch {
  id: string;
  product_id: string;
  analysis_id: string | null;
  supplier_id: string;
  supplier_name: string;
  product_name: string;
  unit_price: number;
  moq: number;
  lead_time: number;
  match_score: number;
  match_reason: string | null;
  import_key_id: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Step 1: Image Analysis (Gemini)
// ============================================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate SHA-256 hash of image for cache lookup
 */
async function generateImageHash(imageBuffer: ArrayBuffer): Promise<string> {
  // Use Web Crypto API for hashing (works in both Node.js and browser)
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    imageBuffer
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Analyze product image using Gemini 1.5 Flash
 * Results are cached in Supabase to avoid redundant API calls
 * Uses image hash for cache lookup even without productId
 */
async function analyzeProductImage(
  imageUrl: string,
  productId?: string
): Promise<{ result: ImageAnalysisResult; cached: boolean; analysisId?: string }> {
  console.log("[Pipeline Step 1] Starting image analysis for:", imageUrl);
  const supabase = await createClient();

  try {
    // Fetch image to generate hash
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageHash = await generateImageHash(imageBuffer);

    // Check cache by image hash (more reliable than URL)
    const { data: cached } = await supabase
      .from("product_analyses")
      .select("*")
      .eq("image_hash", imageHash)
      .maybeSingle();

    if (cached) {
      console.log("[Pipeline Step 1] Cache hit! Using cached analysis:", cached.id);
      return {
        result: {
          productName: cached.product_name,
          description: cached.description,
          category: cached.category,
          hsCode: cached.hs_code || null,
          attributes: cached.attributes as Record<string, string>,
          keywords: cached.keywords as string[],
          confidence: cached.confidence || 0.8,
        },
        cached: true,
        analysisId: cached.id,
      };
    }

    console.log("[Pipeline Step 1] Cache miss. Calling Gemini API...");

    // Perform Gemini analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this product image and extract structured information in JSON format:
{
  "productName": "specific and descriptive product name",
  "description": "detailed product description",
  "category": "product category",
  "hsCode": "HS Code if identifiable (format: XXXX.XX.XX)",
  "attributes": {
    "material": "material type",
    "color": "color",
    "size": "size/dimensions",
    "weight": "weight if applicable"
  },
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Be specific and accurate. If HS Code is not clearly identifiable, set it to null. Return only valid JSON.`;
    // Convert ArrayBuffer to base64 (works in both Node.js and browser)
    const bytes = new Uint8Array(imageBuffer);
    const binary = String.fromCharCode(...bytes);
    const imageBase64 =
      typeof Buffer !== "undefined"
        ? Buffer.from(binary, "binary").toString("base64")
        : btoa(binary);
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response as JSON");
    }

    const analysis = JSON.parse(jsonMatch[0]) as Omit<
      ImageAnalysisResult,
      "confidence"
    >;

    const analysisResult: ImageAnalysisResult = {
      productName: analysis.productName || "Unknown Product",
      description: analysis.description || "",
      category: analysis.category || "Uncategorized",
      hsCode: analysis.hsCode || null,
      attributes: analysis.attributes || {},
      keywords: analysis.keywords || [],
      confidence: 0.9, // Gemini 1.5 Flash typically has high confidence
    };

    console.log("[Pipeline Step 1] Analysis complete:", {
      productName: analysisResult.productName,
      category: analysisResult.category,
      hsCode: analysisResult.hsCode,
    });

    // Cache the result in Supabase
    const { data: cachedData, error: cacheError } = await supabase
      .from("product_analyses")
      .upsert({
        product_id: productId || null,
        image_url: imageUrl,
        image_hash: imageHash,
        product_name: analysisResult.productName,
        description: analysisResult.description,
        category: analysisResult.category,
        hs_code: analysisResult.hsCode,
        attributes: analysisResult.attributes,
        keywords: analysisResult.keywords,
        confidence: analysisResult.confidence,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (cacheError) {
      console.error("[Pipeline Step 1] Cache error:", cacheError);
      // Continue even if caching fails
    } else {
      console.log("[Pipeline Step 1] Analysis cached:", cachedData?.id);
    }

    return {
      result: analysisResult,
      cached: false,
      analysisId: cachedData?.id,
    };
  } catch (error) {
    console.error("[Pipeline Step 1] Error analyzing image with Gemini:", error);
    throw new Error(
      `Failed to analyze product image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ============================================================================
// Step 2: Supplier Matching (ImportKey/Supabase Cache)
// ============================================================================

/**
 * Find supplier matches from Supabase cache
 * Searches by HS Code (priority), product name, category, and keywords
 */
async function findSupplierMatches(
  analysis: ImageAnalysisResult,
  productId?: string,
  analysisId?: string
): Promise<{ matches: SupplierMatch[]; cached: boolean }> {
  console.log("[Pipeline Step 2] Starting supplier matching...");
  const supabase = await createClient();

  // Check if we have cached matches for this product/analysis
  const cacheKey = productId || analysisId;
  if (cacheKey) {
    const { data: cachedMatches } = await supabase
      .from("product_supplier_matches")
      .select("*")
      .eq(productId ? "product_id" : "analysis_id", cacheKey)
      .order("match_score", { ascending: false })
      .limit(10);

    if (cachedMatches && cachedMatches.length > 0) {
      console.log(
        `[Pipeline Step 2] Cache hit! Found ${cachedMatches.length} cached matches`
      );
      return {
        matches: cachedMatches.map((item) => ({
          supplierId: item.supplier_id,
          supplierName: item.supplier_name,
          productName: item.product_name,
          unitPrice: item.unit_price,
          moq: item.moq,
          leadTime: item.lead_time,
          matchScore: item.match_score,
          matchReason: item.match_reason || "Cached match",
          importKeyId: item.import_key_id,
          currency: item.currency || "USD",
        })),
        cached: true,
      };
    }
  }

  console.log("[Pipeline Step 2] Cache miss. Searching supplier_products...");

  // Search in supplier_products table
  // Priority 1: HS Code match (most accurate)
  const allProducts = new Map<string, Record<string, unknown>>();

  if (analysis.hsCode) {
    console.log("[Pipeline Step 2] Searching by HS Code:", analysis.hsCode);
    const { data: hsCodeMatches } = await supabase
      .from("supplier_products")
      .select("*")
      .eq("hs_code", analysis.hsCode)
      .limit(50);

    hsCodeMatches?.forEach((product) => {
      const key = `${product.supplier_id}_${product.product_name}`;
      if (!allProducts.has(key)) {
        allProducts.set(key, product);
      }
    });
  }

  // Priority 2: Product name and keyword search
  const searchTerms = [
    analysis.productName,
    ...analysis.keywords,
    analysis.category,
  ].filter(Boolean);

  console.log("[Pipeline Step 2] Searching by keywords:", searchTerms);

  const searchQueries = searchTerms.map((term) =>
    supabase
      .from("supplier_products")
      .select("*")
      .ilike("product_name", `%${term}%`)
      .limit(20)
  );

  const results = await Promise.all(searchQueries);

  // Deduplicate and collect all products
  results.forEach(({ data }) => {
    data?.forEach((product) => {
      const key = `${product.supplier_id}_${product.product_name}`;
      if (!allProducts.has(key)) {
        allProducts.set(key, product);
      }
    });
  });

  // Calculate match scores and transform
  const matches: SupplierMatch[] = Array.from(allProducts.values())
    .map((item) => {
      const { score, reason } = calculateMatchScore(item, analysis);
      return {
        supplierId: item.supplier_id as string,
        supplierName: (item.supplier_name as string) || "Unknown Supplier",
        productName: item.product_name as string,
        unitPrice: (item.unit_price as number) || 0,
        moq: (item.moq as number) || 1,
        leadTime: (item.lead_time as number) || 0,
        matchScore: score,
        matchReason: reason,
        importKeyId: (item.import_key_id as string) || null,
        currency: (item.currency as string) || "USD",
      };
    })
    .filter((match) => match.matchScore > 30) // Filter low-quality matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10); // Top 10 matches

  console.log(
    `[Pipeline Step 2] Found ${matches.length} supplier matches (from ${allProducts.size} candidates)`
  );

  // Cache the matches
  if (cacheKey && matches.length > 0) {
    const { error: cacheError } = await supabase
      .from("product_supplier_matches")
      .upsert(
        matches.map((match) => ({
          product_id: productId || null,
          analysis_id: analysisId || null,
          supplier_id: match.supplierId,
          supplier_name: match.supplierName,
          product_name: match.productName,
          unit_price: match.unitPrice,
          moq: match.moq,
          lead_time: match.leadTime,
          match_score: match.matchScore,
          match_reason: match.matchReason,
          import_key_id: match.importKeyId,
          currency: match.currency,
          updated_at: new Date().toISOString(),
        })),
        {
          onConflict: productId
            ? "product_id,supplier_id"
            : "analysis_id,supplier_id",
        }
      );

    if (cacheError) {
      console.error("[Pipeline Step 2] Cache error:", cacheError);
    } else {
      console.log("[Pipeline Step 2] Matches cached successfully");
    }
  }

  return {
    matches,
    cached: false,
  };
}

/**
 * Calculate match score based on HS Code, product name, category, and keywords
 * Returns both score and reason for the match
 */
function calculateMatchScore(
  item: Record<string, unknown>,
  analysis: ImageAnalysisResult
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // HS Code match (highest priority - 0-40 points)
  if (analysis.hsCode && item.hs_code) {
    const itemHsCode = item.hs_code.toString().trim();
    const analysisHsCode = analysis.hsCode.trim();

    if (itemHsCode === analysisHsCode) {
      score += 40;
      reasons.push("Exact HS Code match");
    } else if (
      itemHsCode.startsWith(analysisHsCode.substring(0, 4)) ||
      analysisHsCode.startsWith(itemHsCode.substring(0, 4))
    ) {
      score += 25;
      reasons.push("Partial HS Code match");
    }
  }

  // Name similarity (0-35 points)
  const nameSimilarity = calculateStringSimilarity(
    analysis.productName.toLowerCase(),
    ((item.product_name as string) || "").toLowerCase()
  );
  if (nameSimilarity > 0.8) {
    score += 35;
    reasons.push("High name similarity");
  } else if (nameSimilarity > 0.5) {
    score += nameSimilarity * 35;
    reasons.push("Moderate name similarity");
  }

  // Category match (0-15 points)
  if (
    item.category &&
    item.category.toString().toLowerCase() === analysis.category.toLowerCase()
  ) {
    score += 15;
    reasons.push("Category match");
  } else if (item.category) {
    // Partial category match
    const itemCategory = item.category.toString().toLowerCase();
    const analysisCategory = analysis.category.toLowerCase();
    if (
      itemCategory.includes(analysisCategory) ||
      analysisCategory.includes(itemCategory)
    ) {
      score += 8;
      reasons.push("Partial category match");
    }
  }

  // Keyword matches (0-10 points)
  const itemName = ((item.product_name as string) || "").toLowerCase();
  const keywordMatches = analysis.keywords.filter((keyword) =>
    itemName.includes(keyword.toLowerCase())
  );
  if (analysis.keywords.length > 0 && keywordMatches.length > 0) {
    const keywordScore = (keywordMatches.length / analysis.keywords.length) * 10;
    score += keywordScore;
    reasons.push(`${keywordMatches.length} keyword match(es)`);
  }

  const finalScore = Math.min(100, Math.round(score));
  const reason = reasons.length > 0 ? reasons.join(", ") : "Low similarity match";

  return { score: finalScore, reason };
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  const editDist = editDistance(longer, shorter);
  return (longer.length - editDist) / longer.length;
}

/**
 * Calculate Levenshtein edit distance
 */
function editDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// Step 3: Landed Cost Calculation
// ============================================================================

/**
 * Calculate landed cost using formula: Unit * (1+Duty) + Shipping + Fee
 */
function calculateLandedCost(
  match: SupplierMatch,
  quantity: number,
  dutyRate: number,
  shippingCost: number,
  fee: number
): LandedCost {
  console.log(
    `[Pipeline Step 3] Calculating landed cost for supplier: ${match.supplierName}`
  );

  const baseUnitPrice = match.unitPrice;
  const dutyAmount = baseUnitPrice * dutyRate;
  const shippingPerUnit = shippingCost / quantity;
  const feePerUnit = fee / quantity;

  // Formula: Unit * (1+Duty) + Shipping + Fee
  const unitWithDuty = baseUnitPrice * (1 + dutyRate);
  const totalLandedCost = unitWithDuty + shippingPerUnit + feePerUnit;

  return {
    unitPrice: baseUnitPrice,
    dutyRate,
    shippingCost: shippingPerUnit,
    fee: feePerUnit,
    totalLandedCost,
    formula: `Unit * (1+Duty) + Shipping + Fee = ${baseUnitPrice.toFixed(2)} * (1+${dutyRate}) + ${shippingPerUnit.toFixed(2)} + ${feePerUnit.toFixed(2)} = ${totalLandedCost.toFixed(2)}`,
    breakdown: {
      baseUnitPrice,
      dutyAmount,
      shippingPerUnit,
      feePerUnit,
    },
  };
}

// ============================================================================
// Main Pipeline Function
// ============================================================================

/**
 * Complete Intelligence Pipeline:
 * 1. Image Analysis (Gemini) - with Supabase caching
 * 2. Supplier Matching (ImportKey/Supabase Cache) - with caching
 * 3. Landed Cost Calculation (Formula: Unit * (1+Duty) + Shipping + Fee)
 *
 * @param params Pipeline parameters including image URL and cost calculation inputs
 * @returns Complete pipeline result with analysis, matches, and landed costs
 */
export async function runIntelligencePipeline(
  params: IntelligencePipelineParams
): Promise<IntelligencePipelineResult> {
  const startTime = Date.now();
  console.log("[Pipeline] Starting intelligence pipeline with params:", {
    imageUrl: params.imageUrl,
    quantity: params.quantity,
    dutyRate: params.dutyRate,
    productId: params.productId,
  });

  try {
    // Step 1: Image Analysis (with caching)
    const { result: analysis, cached: analysisCached, analysisId } =
      await analyzeProductImage(params.imageUrl, params.productId);

    // Step 2: Supplier Matching (with caching)
    const { matches: supplierMatches, cached: matchesCached } =
      await findSupplierMatches(analysis, params.productId, analysisId);

    // Step 3: Landed Cost Calculation for each match
    console.log("[Pipeline Step 3] Calculating landed costs for", supplierMatches.length, "matches");
    const landedCosts = supplierMatches.map((match) => ({
      match,
      landedCost: calculateLandedCost(
        match,
        params.quantity,
        params.dutyRate,
        params.shippingCost,
        params.fee
      ),
    }));

    // Generate or use existing product ID
    const productId = params.productId || crypto.randomUUID();

    const duration = Date.now() - startTime;
    console.log(`[Pipeline] Completed in ${duration}ms. Cached: analysis=${analysisCached}, matches=${matchesCached}`);

    return {
      productId,
      analysis,
      supplierMatches,
      landedCosts,
      cached: {
        analysis: analysisCached,
        matches: matchesCached,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Pipeline] Error after ${duration}ms:`, error);
    throw new Error(
      `Intelligence pipeline failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Clear cached analysis and matches for a product
 */
export async function clearPipelineCache(productId: string): Promise<void> {
  const supabase = await createClient();

  await Promise.all([
    supabase.from("product_analyses").delete().eq("product_id", productId),
    supabase
      .from("product_supplier_matches")
      .delete()
      .eq("product_id", productId),
  ]);
}

