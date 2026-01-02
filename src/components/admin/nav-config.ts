export type AdminNavBadgeKey = "queue" | "inbox" | "verifications";

export interface AdminNavItem {
  label: string;
  href: string;
  badgeKey?: AdminNavBadgeKey;
}

export interface AdminNavSection {
  label: string;
  href: string;
  items?: AdminNavItem[];
}

export const adminNavSections: AdminNavSection[] = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "Ops",
    href: "/admin/queue",
    items: [
      { label: "Queue", href: "/admin/queue", badgeKey: "queue" },
    ],
  },
  {
    label: "Data",
    href: "/admin/reports",
    items: [
      { label: "Reports", href: "/admin/reports" },
      { label: "Uploads", href: "/admin/upload" },
    ],
  },
  {
    label: "Messaging",
    href: "/admin/inbox",
    items: [
      { label: "Inbox", href: "/admin/inbox", badgeKey: "inbox" },
      { label: "Leads", href: "/admin/leads" },
    ],
  },
  {
    label: "Users",
    href: "/admin/users",
    items: [
      { label: "Users", href: "/admin/users" },
      { label: "Credits", href: "/admin/credits" },
    ],
  },
];
