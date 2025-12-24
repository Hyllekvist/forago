// src/app/(auth)/callback/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function AuthCallbackPage({ searchParams }: Props) {
  const supabase = await supabaseServer();

  const code =
    typeof searchParams?.code === "string" ? searchParams.code : undefined;

  // Hvis Supabase sender en "code" (typisk magic link / OAuth), så exchange den.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirect("/login?error=callback");
    }
  }

  // Hvis vi allerede har session/cookies, så land på default locale.
  const { data, error: userErr } = await supabase.auth.getUser();
  if (userErr) redirect("/login?error=auth");

  if (data?.user) redirect("/dk/feed");

  redirect("/login");
}