module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['your-supabase-url.supabase.co'], // Replace with your Supabase URL
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};