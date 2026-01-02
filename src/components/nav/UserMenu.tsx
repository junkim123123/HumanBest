"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, CreditCard, Settings, HelpCircle, LogOut } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      // Call signout API
      await fetch("/api/auth/signout", { method: "GET" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const menuItems: Array<{
    href?: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    divider?: boolean;
    onClick?: () => void;
  }> = [
    { href: "/app/billing", label: "Billing", icon: CreditCard },
    { href: "/app/settings", label: "Settings", icon: Settings },
    { href: "/app/help", label: "Support", icon: HelpCircle },
    { label: "Sign out", icon: LogOut, divider: true, onClick: handleSignOut },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Account</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          {menuItems.map((item, index) => (
            <div key={item.href || item.label}>
              {item.divider && index > 0 && (
                <div className="my-1 border-t border-slate-200" />
              )}
              {item.onClick ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ) : (
                <Link
                  href={item.href!}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

