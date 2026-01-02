import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // For client components, cookies are managed automatically by the browser
  // @supabase/ssr handles cookie management in the browser
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

