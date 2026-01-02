"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, FileText, FolderKanban, Inbox, HelpCircle, User, ShieldCheck } from "lucide-react";
import { UserMenu } from "./UserMenu";

const appNavItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/analyze", label: "Analyze", icon: Search },
  { href: "/app/reports", label: "Reports", icon: FileText },
  { href: "/app/orders", label: "Orders", icon: FolderKanban },
  { href: "/app/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/app/help", label: "Help", icon: HelpCircle },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">
            {appNavItems.map((item) => {
              const Icon = item.icon;
              const isAnalyze = item.href === "/app/analyze";
              const isActive =
                item.href === "/app"
                  ? pathname === "/app"
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
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}

