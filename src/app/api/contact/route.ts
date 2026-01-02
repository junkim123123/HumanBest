// @ts-nocheck
import { NextResponse } from "next/server";

/**
 * Contact API Route
 * Handles contact form submissions and sends notifications
 * This can be extended to send emails, Slack notifications, etc.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      analysisId,
      productName,
      landedCost,
      category,
      timestamp,
    } = body;

    // Log the contact request (in production, send email/Slack notification)
    console.log("[Contact Request]", {
      analysisId,
      productName,
      landedCost,
      category,
      timestamp,
    });

    // TODO: Send email notification to CTO
    // Example: await sendEmail({
    //   to: 'cto@nexsupply.com',
    //   subject: `New Contact: ${productName}`,
    //   body: `Analysis ID: ${analysisId}\nProduct: ${productName}\nLanded Cost: $${landedCost}\nCategory: ${category}`
    // });

    // TODO: Send Slack notification
    // Example: await sendSlackMessage({
    //   channel: '#leads',
    //   text: `New WhatsApp contact: ${productName} (${category}) - Analysis ID: ${analysisId}`
    // });

    return NextResponse.json({
      success: true,
      message: "Contact request logged successfully",
    });
  } catch (error) {
    console.error("[Contact API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process contact request",
      },
      { status: 500 }
    );
  }
}

