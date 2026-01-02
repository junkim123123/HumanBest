import { PrimaryNav } from "@/components/PrimaryNav";

export default function ReportLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PrimaryNav />
      <div className="max-w-[1120px] mx-auto px-6 py-12">
        <div className="animate-pulse space-y-6">
          {/* Sticky Header Skeleton */}
          <div className="h-20 bg-slate-200 rounded-2xl"></div>
          
          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>

          {/* Key Facts Card Skeleton */}
          <div className="h-64 bg-slate-200 rounded-2xl"></div>

          {/* Content Sections Skeleton */}
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

