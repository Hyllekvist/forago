// src/lib/supabase/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseRoute() {
  const store = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return store.get(name)?.value;
        },
        set(name, value, options) {
          store.set({ name, value, ...options });
        },
        remove(name, options) {
          store.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}