"use client";

import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared container component for consistent max-width and horizontal padding
 * Used by both SiteHeader and all landing sections for alignment
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`mx-auto max-w-[1040px] px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}











