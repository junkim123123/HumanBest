// @ts-nocheck
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { cleanSupplierName, cleanProductText, cleanProductDescription } from "@/lib/server/text-cleaning";
import { guessCategoryFromText } from "@/lib/server/category-guesser";

interface CsvRow {
  [key: string]: string | number | null;
}

interface MappedProduct {
  supplier_id: string;
  supplier_name: string;
  product_name: string;
  product_description: string | null;
  unit_price: number;
  moq: number;
  lead_time: number;
  category: string | null;
  hs_code: string | null;
  currency: string;
  import_key_id: string | null;
  supplier_name_clean?: string; // Cleaned supplier name
  buyer_name_clean?: string; // Cleaned buyer name (if available)
  product_text_clean?: string; // Cleaned product text
}

/**
 * Find column name in CSV headers by keywords (case-insensitive)
 */
function findColumn(
  headers: string[],
  keywords: string[]
): string | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerHeaders.findIndex((h) => h.includes(lowerKeyword));
    if (index !== -1) {
      return headers[index];
    }
  }
  
  return null;
}

/**
 * Extract numeric value from string, return null if invalid
 */
function parseNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  
  // Remove currency symbols and commas
  const cleaned = String(value)
    .replace(/[$,\s]/g, "")
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Generate stable supplier_id from supplier_name
 * Creates a slug: lowercase, non-alnum to "-", max 80 chars
 */
function generateSupplierId(supplierName: string): string {
  const slug = supplierName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alnum sequences with single dash
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
    .substring(0, 80);
  
  return slug || "unknown-supplier";
}

/**
 * Map CSV row to database product format
 */
function mapCsvRowToProduct(
  row: CsvRow,
  headers: string[]
): MappedProduct | null {
  try {
    // Find columns by keywords (expanded list for ImportKey format)
    const supplierNameCol = findColumn(headers, [
      "SUPPLIER",
      "Supplier",
      "Shipper",
      "Exporter",
      "supplier",
      "shipper",
      "exporter",
    ]);
    const buyerNameCol = findColumn(headers, [
      "BUYER",
      "Buyer",
      "Importer",
      "Consignee",
      "buyer",
      "importer",
      "consignee",
    ]);
    // Find cargo_description column (this is the real product description in ImportKey)
    const cargoDescriptionCol = findColumn(headers, [
      "CARGO DESCRIPTION",
      "Cargo Description",
      "cargo description",
      "CARGO",
      "Cargo",
    ]);
    // Fallback to other description columns if cargo_description not found
    const productNameCol = cargoDescriptionCol || findColumn(headers, [
      "Product Description",
      "Commodity",
      "Description",
      "Product",
      "product description",
    ]);
    
    // Find BOL (Bill of Lading) for import_key_id
    const bolCol = findColumn(headers, [
      "BOL",
      "Bill of Lading",
      "B/L",
      "BL",
      "BOL NUMBER",
      "BOL Number",
      "bol",
      "bill of lading",
    ]);
    const hsCodeCol = findColumn(headers, [
      "TARRIF INFORMATION FROM RECORD 61", // Note: ImportKey uses "TARRIF" (typo)
      "TARIFF INFORMATION FROM RECORD 61",
      "Tariff Information",
      "HS Code",
      "HSCode",
      "H.S. Code",
      "HS",
      "tariff",
      "tarrif",
    ]);
    const countryCol = findColumn(headers, [
      "FOREIGN PORT OF LADING",
      "Foreign Port",
      "Country of Origin",
      "Origin",
      "Country",
      "PORT OF UNLADING",
      "Port of Unlading",
    ]);
    const priceCol = findColumn(headers, [
      "Value",
      "Price",
      "Unit Price",
      "UNIT PRICE",
      "PRICE",
      "VALUE",
    ]);
    // Additional columns for ImportKey format
    const quantityCol = findColumn(headers, [
      "MANIFEST QUANTITY",
      "Manifest Quantity",
      "Quantity",
      "QUANTITY",
      "QTY",
    ]);
    const weightCol = findColumn(headers, [
      "WEIGHT",
      "Weight",
      "weight",
    ]);

    // Required fields
    if (!supplierNameCol || !productNameCol) {
      return null;
    }

    const supplierRaw = String(row[supplierNameCol] || "").trim();
    const cargoRaw = String(row[productNameCol] || "").trim();
    const buyerRaw = buyerNameCol ? String(row[buyerNameCol] || "").trim() : "";
    const bolValue = bolCol ? String(row[bolCol] || "").trim() : null;

    if (!supplierRaw || !cargoRaw) {
      return null;
    }

    // Clean supplier name (split by "|" if present)
    const supplierNameClean = cleanSupplierName(supplierRaw);
    if (!supplierNameClean) {
      return null; // Skip if supplier name is empty after cleaning
    }
    const supplierName = supplierNameClean;
    
    // Clean buyer name if available
    const buyerNameClean = buyerRaw ? cleanSupplierName(buyerRaw) : null;
    
    // Use cargo_description as product_description (original, less aggressive cleaning)
    const productDescription = cleanProductDescription(cargoRaw);
    if (!productDescription) {
      return null; // Skip if product description is empty after cleaning
    }
    
    // Build product_name from cleaned cargo_description (first meaningful phrase, max 120 chars)
    const productTextClean = cleanProductText(cargoRaw);
    if (!productTextClean) {
      return null; // Skip if product name is empty after cleaning
    }
    const productName = productTextClean;
    
    // Guess category from product text
    const category = guessCategoryFromText(productDescription);

    // Extract values
    let hsCode = hsCodeCol
      ? String(row[hsCodeCol] || "").trim() || null
      : null;
    
    // Clean HS Code if it contains additional info (e.g., "TARIFF INFORMATION FROM RECORD 61")
    if (hsCode && hsCode.length > 10) {
      // Try to extract HS Code pattern (XXXX.XX.XX or XXXX.XX)
      const hsCodeMatch = hsCode.match(/\b\d{4}\.?\d{2}\.?\d{2}?\b/);
      if (hsCodeMatch) {
        hsCode = hsCodeMatch[0];
      }
    }
    
    const country = countryCol
      ? String(row[countryCol] || "").trim() || null
      : null;
    const unitPrice = priceCol ? parseNumeric(row[priceCol]) : null;
    const quantity = quantityCol ? parseNumeric(row[quantityCol]) : null;
    const weight = weightCol ? parseNumeric(row[weightCol]) : null;

    // Generate stable supplier_id
    const supplierId = generateSupplierId(supplierName);

    // Build enhanced product description with metadata
    const descriptionParts: string[] = [productDescription]; // Start with cleaned cargo_description
    if (country) descriptionParts.push(`Origin: ${country}`);
    if (hsCode) descriptionParts.push(`HS Code: ${hsCode}`);
    if (quantity) descriptionParts.push(`Quantity: ${quantity}`);
    if (weight) descriptionParts.push(`Weight: ${weight}`);
    
    const finalDescription = descriptionParts.length > 1 
      ? descriptionParts.join(" | ") 
      : productDescription;

    return {
      supplier_id: supplierId,
      supplier_name: supplierName, // Cleaned supplier name
      product_name: productName, // First meaningful phrase from cargo_description (max 120 chars)
      product_description: finalDescription, // Full cargo_description with metadata
      unit_price: unitPrice || 0, // Default to 0 if not provided
      moq: 1, // Default MOQ
      lead_time: 0, // Default lead time
      category, // Guessed from product text
      hs_code: hsCode,
      currency: "USD",
      import_key_id: bolValue || null, // Use BOL as import_key_id
    };
  } catch (error) {
    console.error("Error mapping CSV row:", error);
    return null;
  }
}

/**
 * POST /api/admin/upload-csv
 * 
 * Bulk upload CSV data to supplier_products table
 * 
 * Request Body:
 * {
 *   "data": [
 *     { "column1": "value1", "column2": "value2", ... },
 *     ...
 *   ]
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data format",
          message: "Data must be a non-empty array",
        },
        { status: 400 }
      );
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);
    if (headers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid CSV format",
          message: "CSV must have headers",
        },
        { status: 400 }
      );
    }

    console.log(`[Upload CSV] Processing ${data.length} rows with headers:`, headers);

    // Map CSV rows to products
    const mappedProducts: MappedProduct[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    const mappingInfo: {
      supplierNameCol: string | null;
      productNameCol: string | null;
      hsCodeCol: string | null;
      countryCol: string | null;
      priceCol: string | null;
    } = {
      supplierNameCol: null,
      productNameCol: null,
      hsCodeCol: null,
      countryCol: null,
      priceCol: null,
    };

    // Find columns first to provide better error messages (expanded for ImportKey)
    mappingInfo.supplierNameCol = findColumn(headers, [
      "SUPPLIER",
      "Supplier",
      "Shipper",
      "Exporter",
      "supplier",
      "shipper",
      "exporter",
    ]);
    mappingInfo.productNameCol = findColumn(headers, [
      "CARGO DESCRIPTION",
      "Cargo Description",
      "Product Description",
      "Commodity",
      "Description",
      "Product",
      "cargo description",
      "product description",
    ]);
    mappingInfo.hsCodeCol = findColumn(headers, [
      "TARRIF INFORMATION FROM RECORD 61", // Note: ImportKey uses "TARRIF" (typo)
      "TARIFF INFORMATION FROM RECORD 61",
      "Tariff Information",
      "HS Code",
      "HSCode",
      "H.S. Code",
      "HS",
      "tariff",
      "tarrif",
    ]);
    mappingInfo.countryCol = findColumn(headers, [
      "FOREIGN PORT OF LADING",
      "Foreign Port",
      "Country of Origin",
      "Origin",
      "Country",
      "PORT OF UNLADING",
      "Port of Unlading",
    ]);
    mappingInfo.priceCol = findColumn(headers, [
      "Value",
      "Price",
      "Unit Price",
      "UNIT PRICE",
      "PRICE",
      "VALUE",
    ]);

    console.log("[Upload CSV] Column mapping:", mappingInfo);
    console.log("[Upload CSV] Available headers:", headers);

    data.forEach((row, index) => {
      const mapped = mapCsvRowToProduct(row, headers);
      if (mapped) {
        mappedProducts.push(mapped);
      } else {
        const missingFields: string[] = [];
        if (!mappingInfo.supplierNameCol) missingFields.push("supplier_name");
        if (!mappingInfo.productNameCol) missingFields.push("product_name");
        
        const rowSupplier = mappingInfo.supplierNameCol
          ? String(row[mappingInfo.supplierNameCol] || "").trim()
          : "";
        const rowProduct = mappingInfo.productNameCol
          ? String(row[mappingInfo.productNameCol] || "").trim()
          : "";

        let errorMsg = "Missing required fields";
        if (missingFields.length > 0) {
          errorMsg = `Column not found: ${missingFields.join(", ")}`;
        } else if (!rowSupplier || !rowProduct) {
          errorMsg = `Empty values: supplier="${rowSupplier}", product="${rowProduct}"`;
        }

        // Log first few errors for debugging
        if (index < 3) {
          console.log(`[Upload CSV] Row ${index + 1} failed:`, {
            supplierCol: mappingInfo.supplierNameCol,
            productCol: mappingInfo.productNameCol,
            supplierValue: rowSupplier,
            productValue: rowProduct,
            rowKeys: Object.keys(row),
          });
        }

        errors.push({
          row: index + 1,
          error: errorMsg,
        });
      }
    });

    if (mappedProducts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid products found",
          message: "All rows failed validation",
          errors: errors.slice(0, 20), // Return first 20 errors
          mappingInfo: {
            availableHeaders: headers,
            foundColumns: {
              supplierName: mappingInfo.supplierNameCol,
              productName: mappingInfo.productNameCol,
              hsCode: mappingInfo.hsCodeCol,
              country: mappingInfo.countryCol,
              price: mappingInfo.priceCol,
            },
          },
        },
        { status: 400 }
      );
    }

    // Data health check: count rows with logistics patterns
    const logisticsPatternCount = mappedProducts.filter(p => {
      const name = p.product_name.toLowerCase();
      return name.includes("tcnu") || name.includes("hbl") || name.includes("seal");
    }).length;
    
    const logisticsRatio = mappedProducts.length > 0 
      ? (logisticsPatternCount / mappedProducts.length * 100).toFixed(1)
      : "0.0";
    
    // Get top suppliers by count
    const supplierCounts = new Map<string, number>();
    mappedProducts.forEach(p => {
      supplierCounts.set(p.supplier_name, (supplierCounts.get(p.supplier_name) || 0) + 1);
    });
    const topSuppliers = Array.from(supplierCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    
    // Get unique supplier count
    const uniqueSuppliers = supplierCounts.size;
    
    // Sample 5 rows for validation
    const sampleRows = mappedProducts.slice(0, 5).map(p => ({
      supplier_name: p.supplier_name.substring(0, 50),
      product_name: p.product_name.substring(0, 80),
      category: p.category || "Other",
      has_hs_code: !!p.hs_code,
    }));

    console.log(
      `[Upload CSV] ========================================`
    );
    console.log(
      `[Upload CSV] Upload Summary:`
    );
    console.log(
      `[Upload CSV]   Total rows processed: ${data.length}`
    );
    console.log(
      `[Upload CSV]   Mapped products: ${mappedProducts.length}`
    );
    console.log(
      `[Upload CSV]   Errors/skipped: ${errors.length}`
    );
    console.log(
      `[Upload CSV]   Unique suppliers: ${uniqueSuppliers}`
    );
    console.log(
      `[Upload CSV]   Data health: ${logisticsPatternCount}/${mappedProducts.length} (${logisticsRatio}%) contain logistics patterns`
    );
    console.log(
      `[Upload CSV]   Top 10 suppliers by row count:`
    );
    topSuppliers.forEach((s, idx) => {
      console.log(
        `[Upload CSV]     ${idx + 1}. ${s.name}: ${s.count} rows`
      );
    });
    console.log(
      `[Upload CSV]   Sample rows (first 5):`
    );
    sampleRows.forEach((row, idx) => {
      console.log(
        `[Upload CSV]     ${idx + 1}. [${row.category}] ${row.supplier_name} - ${row.product_name} ${row.has_hs_code ? "(has HS)" : ""}`
      );
    });
    console.log(
      `[Upload CSV] ========================================`
    );

    // Bulk insert to Supabase using admin client (bypasses RLS)
    const supabase = createAdminClient();

    // Insert products in batches to avoid timeout
    const batchSize = 100;
    let successCount = 0;
    let failedCount = 0;
    const insertErrors: string[] = [];

    console.log(`[Upload CSV] Attempting to insert ${mappedProducts.length} products`);

    for (let i = 0; i < mappedProducts.length; i += batchSize) {
      const batch = mappedProducts.slice(i, i + batchSize);
      
      // Log first batch for debugging
      if (i === 0) {
        console.log("[Upload CSV] First batch sample:", batch.slice(0, 2));
      }
      
      // Check for existing products using (supplier_id, product_name, import_key_id) deduplication
      // Then insert only new ones
      const { data: existingProducts, error: checkError } = await supabase
        .from("supplier_products")
        .select("supplier_id, product_name, import_key_id")
        .in(
          "supplier_id",
          batch.map((p) => p.supplier_id)
        );

      if (checkError) {
        console.error("[Upload CSV] Error checking existing products:", checkError);
        // Continue anyway, will try to insert all
      }

      // Filter out existing products using (supplier_id, product_name, import_key_id) combination
      const existingSet = new Set(
        (existingProducts || []).map(
          (p) => `${p.supplier_id}|||${p.product_name}|||${p.import_key_id || ""}`
        )
      );

      const newProducts = batch.filter(
        (p) => !existingSet.has(`${p.supplier_id}|||${p.product_name}|||${p.import_key_id || ""}`)
      );

      console.log(`[Upload CSV] Batch ${i / batchSize + 1}: ${newProducts.length} new products out of ${batch.length} total`);

      if (newProducts.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from("supplier_products")
          .insert(newProducts)
          .select();

        if (insertError) {
          console.error(`[Upload CSV] Batch ${i / batchSize + 1} insert error:`, insertError);
          console.error(`[Upload CSV] Error details:`, JSON.stringify(insertError, null, 2));
          insertErrors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
          failedCount += newProducts.length;
        } else {
          const inserted = insertedData?.length || 0;
          successCount += inserted;
          failedCount += newProducts.length - inserted;
          console.log(`[Upload CSV] Batch ${i / batchSize + 1}: Successfully inserted ${inserted} products`);
        }
      } else {
        // All products in this batch already exist
        console.log(`[Upload CSV] Batch ${i / batchSize + 1}: All ${batch.length} products already exist`);
        // Count as success since they already exist in database
        successCount += batch.length;
      }
    }

      // Note: Some products might have failed to insert
      // We'll return the counts we tracked

      return NextResponse.json(
        {
          success: true,
          message: "CSV data uploaded successfully",
          data: {
            totalRows: data.length,
            mappedProducts: mappedProducts.length,
            successCount,
            failedCount,
            errorCount: errors.length,
            errors: errors.slice(0, 10), // Return first 10 errors
            insertErrors: insertErrors.slice(0, 5), // Return first 5 insert errors
            dataHealth: {
              logisticsPatternCount,
              logisticsRatio: `${logisticsRatio}%`,
              uniqueSuppliers,
              topSuppliers: topSuppliers.slice(0, 5), // Return top 5 for response
              sampleRows, // Return 5 sample rows for validation
            },
          },
        },
        { status: 200 }
      );
  } catch (error) {
    console.error("[Upload CSV] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to process CSV upload",
        stack:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}

