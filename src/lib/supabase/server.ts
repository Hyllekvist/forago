// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // IMPORTANT: in Server Components, Next disallows setting cookies.
        // So we provide setters, but they will only be used in Route Handlers / Server Actions.
        set() {
          // no-op in Server Components
        },
        remove() {
          // no-op in Server Components
        },
      },
    }
  );
}
