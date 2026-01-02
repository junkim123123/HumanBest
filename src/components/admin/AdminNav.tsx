"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { adminNavSections, type AdminNavBadgeKey } from "./nav-config"

interface AdminNavProps {
  badgeCounts?: Partial<Record<AdminNavBadgeKey, number>>
}

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav({ badgeCounts }: AdminNavProps) {
  const pathname = usePathname()

  const activeSection = adminNavSections.find((section) => {
    if (isActivePath(pathname, section.href)) return true
    if (!section.items) return false
    return section.items.some((item) => isActivePath(pathname, item.href))
  })

  const activeItems = activeSection?.items ?? []
  const showSubNav = activeItems.length > 1

  const getBadge = (key?: AdminNavBadgeKey) => {
    if (!key) return null
    const value = badgeCounts?.[key] ?? 0
    if (!value) return null
    return (
      <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white">
        {value}
      </span>
    )
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold text-blue-600">
              NexSupply Admin
            </Link>
            <div className="flex items-center gap-1">
              {adminNavSections.map((section) => {
                const sectionActive = section === activeSection
                return (
                  <Link
                    key={section.label}
                    href={section.href}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      sectionActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>{section.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <Link
            href="/app"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to App
          </Link>
        </div>
      </div>

      {showSubNav && (
        <div className="border-t border-slate-200 bg-white/95">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 h-12">
              {activeItems.map((item) => {
                const tabActive = isActivePath(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      tabActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>{item.label}</span>
                    {getBadge(item.badgeKey)}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
