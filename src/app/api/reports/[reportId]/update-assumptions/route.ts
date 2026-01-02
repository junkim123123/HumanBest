// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { inferCostInputs } from "@/lib/cost-inference";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await ctx.params;
  const body = await request.json();
  const admin = getSupabaseAdmin();

  try {
    const unitsPerCase = 1;
    const boxWeightGrams = typeof body.boxWeightGrams === "number" ? body.boxWeightGrams : null;
    const dimsCm = [body.boxLengthCm, body.boxWidthCm, body.boxHeightCm].map((d: unknown) =>
      typeof d === "number" && Number.isFinite(d) ? d : null
    );

    // Fetch current report with baseline + pipeline_result for category context
    const { data: reportData, error: fetchError } = await admin
      .from("reports")
      .select("baseline, input_status, pipeline_result, category")
      .eq("id", reportId)
      .single();

    if (fetchError || !reportData?.baseline) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const analysis = reportData.pipeline_result?.analysis || {
      category: reportData.category || "unknown",
      hsCode: reportData.pipeline_result?.analysis?.hsCode,
      labelData: reportData.pipeline_result?.analysis?.labelData,
    };

    const userVolumeM3 = dimsCm.every((v) => v !== null)
      ? ((dimsCm[0] as number) * (dimsCm[1] as number) * (dimsCm[2] as number)) / 1_000_000
      : undefined;

    const inferredInputs = inferCostInputs({
      analysis,
      marketEstimate: reportData.pipeline_result?.marketEstimate,
      userInputs: {
        unitWeightG: boxWeightGrams ?? undefined,
        unitVolumeM3: userVolumeM3,
        cartonPack: unitsPerCase,
      },
    });

    const baseline = reportData.baseline as any;
    const unitPrice = baseline.costRange?.standard?.unitPrice ?? 0;
    const unitPriceConservative = baseline.costRange?.conservative?.unitPrice ?? unitPrice;

    const shippingRange = inferredInputs.shippingPerUnit.range || {
      p10: inferredInputs.shippingPerUnit.value * 0.85,
      p50: inferredInputs.shippingPerUnit.value,
      p90: inferredInputs.shippingPerUnit.value * 1.2,
    };
    const dutyRateRange = inferredInputs.dutyRate.range || {
      p10: inferredInputs.dutyRate.value * 0.9,
      p50: inferredInputs.dutyRate.value,
      p90: inferredInputs.dutyRate.value * 1.15,
    };
    const feesRange = inferredInputs.feesPerUnit.range || {
      p10: inferredInputs.feesPerUnit.value,
      p50: inferredInputs.feesPerUnit.value,
      p90: inferredInputs.feesPerUnit.value,
    };

    const dutyPerUnit = unitPrice * dutyRateRange.p50;
    const dutyPerUnitConservative = unitPriceConservative * dutyRateRange.p90;
    const shippingPerUnit = shippingRange.p50;
    const shippingPerUnitConservative = shippingRange.p90;
    const feesPerUnit = feesRange.p50;

    const totalRange = {
      p10: unitPrice + shippingRange.p10 + unitPrice * dutyRateRange.p10 + feesRange.p10,
      p50: unitPrice + shippingRange.p50 + dutyPerUnit + feesRange.p50,
      p90: unitPriceConservative + shippingPerUnitConservative + dutyPerUnitConservative + feesRange.p90,
    };

    const updatedBaseline = {
      ...baseline,
      costRange: {
        standard: {
          ...baseline.costRange?.standard,
          shippingPerUnit,
          dutyPerUnit,
          feePerUnit: feesPerUnit,
          totalLandedCost: totalRange.p50,
          range: {
            shippingPerUnit: shippingRange,
            dutyPerUnit: {
              p10: unitPrice * dutyRateRange.p10,
              p50: dutyPerUnit,
              p90: dutyPerUnitConservative,
            },
            feePerUnit: feesRange,
            totalLandedCost: totalRange,
          },
        },
        conservative: {
          ...baseline.costRange?.conservative,
          shippingPerUnit: shippingPerUnitConservative,
          dutyPerUnit: dutyPerUnitConservative,
          feePerUnit: feesPerUnit,
          totalLandedCost: totalRange.p90,
        },
        range: {
          shippingPerUnit: shippingRange,
          dutyPerUnit: {
            p10: unitPrice * dutyRateRange.p10,
            p50: dutyPerUnit,
            p90: dutyPerUnitConservative,
          },
          feePerUnit: feesRange,
          totalLandedCost: totalRange,
          billableWeightKg: inferredInputs.billableWeightKg.range,
        },
      },
      evidence: {
        ...baseline.evidence,
        assumptions: {
          ...baseline.evidence?.assumptions,
          weight: boxWeightGrams ? `${boxWeightGrams}g (user)` : inferredInputs.unitWeightG.explanation,
          volume: userVolumeM3 ? `${userVolumeM3.toFixed(4)} m³ (user)` : inferredInputs.unitVolumeM3.explanation,
          unitsPerCase: `Assuming ${unitsPerCase} unit shipment`,
        },
        inferredInputs: {
          ...baseline.evidence?.inferredInputs,
          ...inferredInputs,
          unitsPerCase,
        },
      },
    };

    const assumptionRecords = [
      {
        report_id: reportId,
        key: "units_per_case",
        value: String(unitsPerCase),
        unit: "unit",
        source: "category_default",
        confidence: "low",
        rationale: "Always assume 1 unit shipment",
        range_json: { p10: 1, p50: 1, p90: 1 },
        updated_at: new Date().toISOString(),
      },
      {
        report_id: reportId,
        key: "unit_weight_g",
        value: String(inferredInputs.unitWeightG.value),
        unit: "g",
        source: inferredInputs.unitWeightG.provenance || "category_default",
        confidence: inferredInputs.unitWeightG.confidence >= 80 ? "high" : inferredInputs.unitWeightG.confidence >= 60 ? "medium" : "low",
        rationale: inferredInputs.unitWeightG.explanation,
        range_json: inferredInputs.unitWeightG.range,
        updated_at: new Date().toISOString(),
      },
      {
        report_id: reportId,
        key: "unit_volume_m3",
        value: String(inferredInputs.unitVolumeM3.value),
        unit: "m3",
        source: inferredInputs.unitVolumeM3.provenance || "category_default",
        confidence: inferredInputs.unitVolumeM3.confidence >= 80 ? "high" : inferredInputs.unitVolumeM3.confidence >= 60 ? "medium" : "low",
        rationale: inferredInputs.unitVolumeM3.explanation,
        range_json: inferredInputs.unitVolumeM3.range,
        updated_at: new Date().toISOString(),
      },
      {
        report_id: reportId,
        key: "shipping_per_unit_usd",
        value: String(inferredInputs.shippingPerUnit.value),
        unit: "usd",
        source: inferredInputs.shippingPerUnit.provenance || "category_default",
        confidence: inferredInputs.shippingPerUnit.confidence >= 80 ? "high" : inferredInputs.shippingPerUnit.confidence >= 60 ? "medium" : "low",
        rationale: inferredInputs.shippingPerUnit.explanation,
        range_json: shippingRange,
        updated_at: new Date().toISOString(),
      },
      {
        report_id: reportId,
        key: "duty_rate",
        value: String(inferredInputs.dutyRate.value),
        unit: "rate",
        source: inferredInputs.dutyRate.provenance || "category_default",
        confidence: inferredInputs.dutyRate.confidence >= 80 ? "high" : inferredInputs.dutyRate.confidence >= 60 ? "medium" : "low",
        rationale: inferredInputs.dutyRate.explanation,
        range_json: dutyRateRange,
        updated_at: new Date().toISOString(),
      },
    ];

    const { error: updateError } = await admin
      .from("reports")
      .update({
        baseline: updatedBaseline,
        weight_confirmed: boxWeightGrams
          ? JSON.stringify({
              value: boxWeightGrams,
              confirmed: true,
              source: "MANUAL",
              confidence: 1.0,
              evidenceSnippet: "User provided box weight in Adjust",
            })
          : reportData.weight_confirmed,
        case_pack_confirmed: JSON.stringify({
          value: unitsPerCase,
          confirmed: true,
          source: "DEFAULT",
          confidence: 0.3,
          evidenceSnippet: "Fixed to 1 unit shipment",
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("[Update Assumptions] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update assumptions" },
        { status: 500 }
      );
    }

    await admin.from("report_assumptions").upsert(assumptionRecords, {
      onConflict: "report_id,key",
    });

    return NextResponse.json({
      success: true,
      message: "Assumptions updated successfully",
      newCostRange: {
        standard: totalRange.p50,
        conservative: totalRange.p90,
      },
    });
  } catch (error) {
    console.error("[Update Assumptions] Error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
