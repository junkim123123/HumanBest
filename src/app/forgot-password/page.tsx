"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/update-password?next=" + encodeURIComponent(next))}`,
      });
      if (error) throw error;
      setMessage("Check your email for the reset link.");
    } catch (err: any) {
      setError(err.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-indigo-100/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reset</p>
            <h1 className="text-3xl font-bold text-slate-900">Forgot your password?</h1>
            <p className="text-sm text-slate-600">We will email you a secure link to set a new password.</p>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {message && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 border border-slate-200/80 bg-white/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm"
                placeholder="you@example.com"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-200/50 transition-all"
            >
              {loading ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <div className="space-y-3 text-center text-sm text-slate-500">
            <Link href={`/signin?next=${encodeURIComponent(next)}`} className="hover:text-slate-700 transition-colors">
              ← Back to sign in
            </Link>
            <p className="text-xs text-slate-500">We keep your reports private. By continuing you agree to our <Link href="/terms" className="text-blue-700 hover:underline">Terms</Link> and <Link href="/privacy" className="text-blue-700 hover:underline">Privacy</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
