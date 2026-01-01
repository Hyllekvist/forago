// src/lib/supabase/server-readonly.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServerReadOnly() {
  const store = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return store.get(name)?.value;
        },
        // RSC: må ikke sætte cookies her -> no-op
        set() {},
        remove() {},
      },
    }
  );
}