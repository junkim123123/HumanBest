import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
        variant === "outline"
          ? "border border-slate-300 bg-white text-slate-700"
          : "bg-slate-100 text-slate-700",
        className
      )}
    >
      {children}
    </span>
  );
}














