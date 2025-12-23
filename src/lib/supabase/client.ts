import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Standardnavn: createClient()
 * (Vi eksporterer også supabaseBrowser() så ældre imports ikke knækker.)
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(url, key);
}

export function supabaseBrowser() {
  return createClient();
}