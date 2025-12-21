import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function CallbackPage() {
  // Supabase SSR helper will read auth cookies after magic link flow.
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();

  // Send user to default locale hub
  if (data.user) redirect("/dk/feed");
  redirect("/dk");
}
