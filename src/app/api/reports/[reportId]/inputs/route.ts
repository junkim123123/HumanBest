// @ts-nocheck
import { NextResponse } from "next/server";
import crypto from "crypto";
import { Buffer } from "node:buffer";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { reportId } = await params;
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "MISSING_REPORT_ID" },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const upcRaw = form.get("upc");
    const originRaw = form.get("originCountry");
    const unitWeightRaw = form.get("unitWeight");
    const barcodeImage = form.get("barcodeImage") as File | null;

    const upc = typeof upcRaw === "string" ? upcRaw.trim() : "";
    const originCountry = typeof originRaw === "string" ? originRaw.trim() : "";

    const toNumber = (value: FormDataEntryValue | null) => {
      if (typeof value !== "string") return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const unitWeight = toNumber(unitWeightRaw);
    const unitsPerCase = 1;

    if (!upc && !originCountry && unitWeight === null && !barcodeImage) {
      return NextResponse.json(
        { success: false, error: "NO_FIELDS_PROVIDED" },
        { status: 400 }
      );
    }

    if (unitWeight !== null && unitWeight <= 0) {
      return NextResponse.json(
        { success: false, error: "INVALID_UNIT_WEIGHT" },
        { status: 400 }
      );
    }

    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("data, pipeline_result, input_status, hasBarcodeImage, hasLabelImage, hasProductImage")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { success: false, error: "REPORT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const existingData = report.data || {};
    const existingInputStatus = report.input_status || existingData.inputStatus || {};
    const pipelineResult = report.pipeline_result || {};
    const uploadAudit = {
      ...(pipelineResult.uploadAudit || existingData.uploadAudit || {}),
    } as Record<string, any>;

    let barcodeImageUrl: string | null =
      existingData.barcode_image_url || pipelineResult.barcodeImagePath || null;

    if (barcodeImage) {
      try {
        const arrayBuffer = await barcodeImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileExt = barcodeImage.name?.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `${user.id}/barcode-${crypto.randomUUID()}.${fileExt}`;
        const contentType = barcodeImage.type || "image/jpeg";

        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(storagePath, buffer, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          return NextResponse.json(
            { success: false, error: "UPLOAD_FAILED", details: uploadError.message },
            { status: 500 }
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(storagePath);

        barcodeImageUrl = publicUrlData?.publicUrl || storagePath;
        uploadAudit.barcodeImage = true;
      } catch (uploadErr: any) {
        return NextResponse.json(
          { success: false, error: "UPLOAD_FAILED", details: uploadErr?.message },
          { status: 500 }
        );
      }
    }

    uploadAudit.barcodeImage = uploadAudit.barcodeImage || Boolean(barcodeImageUrl);

    const updatedInputStatus = {
      ...existingInputStatus,
      barcode: upc || existingInputStatus.barcode,
      barcodePhotoUploaded: existingInputStatus.barcodePhotoUploaded || Boolean(barcodeImageUrl),
      barcodeDecoded: upc ? true : existingInputStatus.barcodeDecoded,
      unitWeight: unitWeight ?? existingInputStatus.unitWeight,
      unitsPerCase: unitsPerCase,
      originCountry: originCountry || existingInputStatus.originCountry,
      countryOfOrigin: originCountry || existingInputStatus.countryOfOrigin,
      updatedAt: new Date().toISOString(),
    } as Record<string, any>;

    const updatedData = {
      ...existingData,
      upc: upc || existingData.upc,
      barcode: upc || existingData.barcode,
      originCountry: originCountry || existingData.originCountry,
      countryOfOrigin: originCountry || existingData.countryOfOrigin,
      weightGrams: unitWeight ?? existingData.weightGrams,
      unitWeight: unitWeight ?? existingData.unitWeight,
      unitsPerCase,
      barcode_image_url: barcodeImageUrl ?? existingData.barcode_image_url,
      hasBarcodeImage: Boolean(barcodeImageUrl || report.hasBarcodeImage),
      uploadAudit: { ...uploadAudit },
      inputStatus: updatedInputStatus,
    } as Record<string, any>;

    const updatedPipelineResult = {
      ...pipelineResult,
      barcodeImagePath: barcodeImageUrl ?? pipelineResult.barcodeImagePath,
      uploadAudit: { ...uploadAudit },
    } as Record<string, any>;

    const { error: updateError } = await supabase
      .from("reports")
      .update({
        data: updatedData,
        input_status: updatedInputStatus,
        pipeline_result: updatedPipelineResult,
        hasBarcodeImage: updatedData.hasBarcodeImage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "UPDATE_FAILED", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inputStatus: updatedInputStatus,
      uploadAudit: updatedPipelineResult.uploadAudit,
      barcodeImageUrl,
    });
  } catch (error: any) {
    console.error("[inputs PATCH]", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", details: error.message },
      { status: 500 }
    );
  }
}
