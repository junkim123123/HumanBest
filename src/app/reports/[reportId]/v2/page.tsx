import { notFound } from "next/navigation";
import ReportV2Client from "./ReportV2Client";

export const dynamic = "force-dynamic";

async function getReport(reportId: string) {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || "http://localhost:3000";
    
    const res = await fetch(`${baseUrl}/api/reports/${reportId}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) return null;

    const json = await res.json().catch(() => null);
    if (!json?.success || !json?.report) return null;

    return json.report;
  } catch (error) {
    console.error("[Report V2 Page] Error fetching report:", error);
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  
  if (!reportId) {
    notFound();
  }

  const report = await getReport(reportId);
  
  if (!report) {
    notFound();
  }

  return <ReportV2Client key={reportId} reportId={reportId} report={report} />;
}

