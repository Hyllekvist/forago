export const dynamic = "force-dynamic"; 

import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { returnTo?: string };
}) {
  const locale = params.locale || "dk";
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;

  if (!user) {
    const returnTo = `/${locale}/onboarding${searchParams?.returnTo ? `?returnTo=${encodeURIComponent(searchParams.returnTo)}` : ""}`;
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // har du allerede en profil? så videre
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, handle, display_name, bio, locale")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.handle) {
    const rt = searchParams?.returnTo;
    redirect(rt && rt.startsWith("/") ? rt : `/${locale}/today`);
  }

  return <OnboardingClient locale={locale as any} returnTo={searchParams?.returnTo ?? null} />;
}
