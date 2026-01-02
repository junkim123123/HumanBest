import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, category, message, metadata } = body || {};
    if (!email || !message || !category) {
      return NextResponse.json({ success: false, error: "missing_fields" }, { status: 400 });
    }

    const payload = {
      email,
      category,
      message,
      metadata: metadata || {},
      screenshot_base64: metadata?.screenshot || null,
    } as any;

    let ticketId: string | null = null;
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await (admin.from("support_requests") as any)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      ticketId = data?.id || null;
    } catch (dbErr: any) {
      console.warn("[support] insert failed", dbErr?.message || dbErr);
    }

    if (process.env.SUPPORT_WEBHOOK_URL) {
      try {
        await fetch(process.env.SUPPORT_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "support",
            email,
            category,
            message,
            metadata,
            ticketId,
          }),
        });
      } catch (webhookErr) {
        console.warn("[support] webhook failed", webhookErr);
      }
    }

    return NextResponse.json({ success: true, ticketId });
  } catch (error: any) {
    console.error("[support] failed", error?.message || error);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
