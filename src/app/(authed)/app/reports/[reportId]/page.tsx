import { notFound } from "next/navigation";
import ReportV2Page from "@/components/report/ReportV2Page";

export const dynamic = "force-dynamic";

async function getReport(reportId: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

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
    console.error("[App Report Page] Error fetching report:", error);
    return null;
  }
}

export default async function AppReportDetailPage({
  params,
}: {
  params: { reportId: string };
}) {
  const reportId = params.reportId;
  if (!reportId) notFound();

  const report = await getReport(reportId);
  if (!report) notFound();

  return <ReportV2Page key={reportId} reportId={reportId} report={report} />;
}
