"use client"

import React, { useState } from "react"

interface SectionNavItem {
  id: string
  label: string
}

interface SectionNavProps {
  items: SectionNavItem[]
  activeId: string
  onJump: (id: string) => void
}

export default function SectionNav({ items, activeId, onJump }: SectionNavProps) {
  const [open, setOpen] = useState(false)

  const handleActivate = (id: string) => onJump(id)

  const handleKeyDown = (id: string, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleActivate(id)
    }
  }

  return (
    <>
      {/* Desktop dot nav */}
      <aside
        className="hidden lg:flex fixed right-6 lg:right-7 top-1/2 z-30 -translate-y-1/2 flex-col items-end gap-2.5"
        aria-label="Section navigation"
      >
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleActivate(item.id)}
              onKeyDown={(e) => handleKeyDown(item.id, e)}
              className="group relative flex items-center gap-2 rounded-full p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-current={isActive ? "true" : undefined}
              aria-label={item.label}
            >
              <span
                className={`relative inline-flex h-2.5 w-2.5 items-center justify-center rounded-full transition ${
                  isActive
                    ? "bg-blue-600 shadow-[0_0_0_6px_rgba(37,99,235,0.12)]"
                    : "bg-slate-300 group-hover:bg-slate-400"
                }`}
                aria-hidden
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full ring-4 ring-blue-500/10" aria-hidden />
                )}
              </span>
              <span
                className={`pointer-events-none select-none rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition-opacity ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </aside>

      {/* Mobile jump menu */}
      <div className="xl:hidden fixed bottom-5 right-5 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-expanded={open}
            aria-label="Open section navigation"
          >
            Jump to section
            <span className={`h-2 w-2 rounded-full ${open ? "bg-white" : "bg-white/70"}`} aria-hidden />
          </button>

          {open && (
            <div
              className="mt-2 rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur p-3 space-y-1"
              role="menu"
              aria-label="Section navigation menu"
            >
              {items.map((item) => {
                const isActive = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleActivate(item.id)
                      setOpen(false)
                    }}
                    onKeyDown={(e) => handleKeyDown(item.id, e)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition text-left ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                    aria-current={isActive ? "true" : undefined}
                    role="menuitem"
                  >
                    <span>{item.label}</span>
                    <span className={`h-2 w-2 rounded-full ${isActive ? "bg-blue-600" : "bg-slate-200"}`} aria-hidden />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
