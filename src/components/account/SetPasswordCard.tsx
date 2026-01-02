"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

export default function SetPasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message || "Failed to update password");
    } else {
      toast.success("Password updated");
      setPassword("");
      setConfirm("");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Set a password</p>
          <p className="text-xs text-slate-500">Use this when you prefer email + password over magic links.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-electric-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-electric-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          New password
          <input
            type="password"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-electric-blue-400 focus:ring-2 focus:ring-electric-blue-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Confirm
          <input
            type="password"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-electric-blue-400 focus:ring-2 focus:ring-electric-blue-100"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
      </div>
    </form>
  );
}
