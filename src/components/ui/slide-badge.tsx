import { cn } from "@/lib/utils";

interface SlideBadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "neutral" | "onTrack" | "tight" | "notEnough";
}

export function SlideBadge({ children, className, variant = "neutral" }: SlideBadgeProps) {
  const variantClasses = {
    neutral: "border-slate-200/80 bg-slate-50/80 backdrop-blur text-slate-600",
    onTrack: "border-emerald-300/60 bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur text-emerald-700 shadow-sm shadow-emerald-100",
    tight: "border-amber-300/60 bg-gradient-to-br from-amber-50 to-yellow-50 backdrop-blur text-amber-700 shadow-sm shadow-amber-100",
    notEnough: "border-rose-300/60 bg-gradient-to-br from-rose-50 to-red-50 backdrop-blur text-rose-700 shadow-sm shadow-rose-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

