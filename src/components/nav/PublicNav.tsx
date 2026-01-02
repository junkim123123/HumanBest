"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, DollarSign } from "lucide-react";

const publicNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analyze", label: "Analyze", icon: Search },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
];

export function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              const isAnalyze = item.href === "/analyze";
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : isAnalyze
                    ? pathname === "/analyze" || pathname?.startsWith("/app/analyze")
                    : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "text-electric-blue-600 border-b-2 border-electric-blue-600"
                        : "text-slate-600 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/signin"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

