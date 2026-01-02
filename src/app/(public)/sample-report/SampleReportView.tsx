import ReportV2Page from "@/components/report/ReportV2Page";
import { sampleReport } from "@/lib/report/sample-report";

export function SampleReportView() {
  return <ReportV2Page reportId={sampleReport.id} initialReport={sampleReport} />;
}
