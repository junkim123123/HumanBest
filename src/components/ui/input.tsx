import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm",
        "focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:border-electric-blue-500",
        className
      )}
      {...props}
    />
  );
}














