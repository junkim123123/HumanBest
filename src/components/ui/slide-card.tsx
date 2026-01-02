import { cn } from "@/lib/utils";

interface SlideCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "default" | "dense" | "loose";
}

export function SlideCard({ children, className, padding = "default" }: SlideCardProps) {
  const paddingClasses = {
    default: "p-5 md:p-6",
    dense: "p-4 md:p-5",
    loose: "p-6 md:p-7",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur shadow-sm hover:shadow-md transition-all duration-300",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

