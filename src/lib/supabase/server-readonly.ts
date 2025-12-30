// src/lib/supabase/server-readonly.ts
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function supabaseServerReadOnly() {
  const cookieStore = cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          // send auth cookie videre hvis den findes
          Cookie: cookieStore.toString(),
        },
      },
    }
  );
}
