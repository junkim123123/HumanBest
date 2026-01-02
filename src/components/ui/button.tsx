import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export function Button({
  children,
  variant = "default",
  size = "md",
  className,
  asChild,
  ...props
}: ButtonProps) {
  // Remove asChild from props to prevent it from being passed to DOM
  const { asChild: _, ...buttonProps } = props as any;
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        variant === "outline"
          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          : "bg-electric-blue-600 text-white hover:bg-electric-blue-700",
        size === "sm" && "px-3 py-1.5 text-sm h-10",
        size === "md" && "px-4 py-2 text-base h-12",
        size === "lg" && "px-6 py-3 text-lg h-12",
        className
      )}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

