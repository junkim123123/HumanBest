import { 
  Search, 
  FileText, 
  FolderKanban, 
  Inbox, 
  ShieldCheck, 
  HelpCircle,
  type LucideIcon
} from "lucide-react";

export type UserRole = "OWNER" | "MEMBER" | "VIEWER";

export type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  requiresRole?: UserRole;
};

export function buildAppNav(role: UserRole = "VIEWER") {
  const primary: NavItem[] = [
    { label: "Analyze", href: "/app/analyze", icon: Search },
    { label: "Reports", href: "/app/reports", icon: FileText },
    { label: "Orders", href: "/app/orders", icon: FolderKanban },
  ];

  const secondaryAll: NavItem[] = [
    { label: "Inbox", href: "/app/inbox", icon: Inbox },
    { label: "Admin", href: "/app/admin", icon: ShieldCheck, requiresRole: "OWNER" },
    { label: "Help", href: "/app/help", icon: HelpCircle },
  ];

  const secondary = secondaryAll.filter((item) => {
    if (!item.requiresRole) return true;
    return role === item.requiresRole;
  });

  return { primary, secondary };
}
