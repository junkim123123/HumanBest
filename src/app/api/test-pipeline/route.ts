// @ts-nocheck
import { NextResponse } from "next/server";
import { runIntelligencePipeline } from "@/lib/intelligence-pipeline";

/**
 * GET /api/test-pipeline
 * 
 * 테스트용 Intelligence Pipeline 엔드포인트
 * 더미 데이터를 사용하여 파이프라인을 실행하고 결과를 JSON으로 반환합니다.
 * 
 * Query Parameters (optional):
 * - imageUrl: 테스트할 이미지 URL (기본값: 더미 이미지)
 * - quantity: 주문 수량 (기본값: 100)
 * - dutyRate: 관세율 (기본값: 0.15 = 15%)
 * - shippingCost: 배송비 (기본값: 500)
 * - fee: 수수료 (기본값: 100)
 * - productId: 기존 제품 ID (선택사항)
 * 
 * Example:
 * GET /api/test-pipeline?imageUrl=https://example.com/product.jpg&quantity=200
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 더미 데이터 또는 쿼리 파라미터에서 가져오기
    const imageUrl =
      searchParams.get("imageUrl") ||
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"; // 더미 이미지
    const quantity = parseInt(searchParams.get("quantity") || "100", 10);
    const dutyRate = parseFloat(searchParams.get("dutyRate") || "0.15");
    const shippingCost = parseFloat(searchParams.get("shippingCost") || "500");
    const fee = parseFloat(searchParams.get("fee") || "100");
    const productId = searchParams.get("productId") || undefined;

    console.log("[Test API] Running pipeline with params:", {
      imageUrl,
      quantity,
      dutyRate,
      shippingCost,
      fee,
      productId,
    });

    // 파이프라인 실행
    const result = await runIntelligencePipeline({
      imageUrl,
      quantity,
      dutyRate,
      shippingCost,
      fee,
      productId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Intelligence pipeline executed successfully",
        data: result,
        metadata: {
          executionTime: new Date().toISOString(),
          cached: {
            analysis: result.cached.analysis,
            matches: result.cached.matches,
          },
          summary: {
            analysisConfidence: result.analysis.confidence,
            hsCode: result.analysis.hsCode,
            supplierMatchesCount: result.supplierMatches.length,
            landedCostsCount: result.landedCosts.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Test API] Pipeline execution failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Intelligence pipeline execution failed",
        stack: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-pipeline
 * 
 * POST 요청으로 파이프라인을 실행할 수도 있습니다.
 * Request Body:
 * {
 *   "imageUrl": "https://example.com/product.jpg",
 *   "quantity": 100,
 *   "dutyRate": 0.15,
 *   "shippingCost": 500,
 *   "fee": 100,
 *   "productId": "optional-product-id"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    let {
      imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      quantity = 100,
      dutyRate = 0.15,
      shippingCost = 500,
      fee = 100,
      productId,
    } = body;

    // Handle base64 data URL
    // If imageUrl is a data URL (starts with data:), we need to handle it
    // For now, the pipeline expects a URL, so we'll use the data URL as-is
    // The pipeline's fetch will handle data URLs

    console.log("[Test API] Running pipeline with POST body:", {
      imageUrl,
      quantity,
      dutyRate,
      shippingCost,
      fee,
      productId,
    });

    // 파이프라인 실행
    const result = await runIntelligencePipeline({
      imageUrl,
      quantity,
      dutyRate,
      shippingCost,
      fee,
      productId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Intelligence pipeline executed successfully",
        data: result,
        metadata: {
          executionTime: new Date().toISOString(),
          cached: {
            analysis: result.cached.analysis,
            matches: result.cached.matches,
          },
          summary: {
            analysisConfidence: result.analysis.confidence,
            hsCode: result.analysis.hsCode,
            supplierMatchesCount: result.supplierMatches.length,
            landedCostsCount: result.landedCosts.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Test API] Pipeline execution failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Intelligence pipeline execution failed",
        stack: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
      },
      { status: 500 }
    );
  }
}

