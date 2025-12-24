import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

function renderPlain(body: string) {
  // Simple, safe rendering without extra deps: paragraphs + line breaks
  const parts = body.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  return parts.map((p, i) => (
    <p key={i} style={{ margin: "0 0 12px", opacity: 0.92, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
      {p}
    </p>
  ));
}

export default async function GuideSlugPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) return notFound();
  const locale: Locale = params.locale;
  const slug = params.slug;

const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("guides")
    .select("slug, is_published, guide_translations(title, excerpt, body, locale)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.is_published) return notFound();

  const t = (data as any).guide_translations?.find((x: any) => x.locale === locale);
  const title = (t?.title as string) || slug;
  const body = (t?.body as string) || "";

  return (
    <main style={{ padding: 16, maxWidth: 820, margin: "0 auto" }}>
      <p style={{ margin: 0 }}>
        <Link href={`/${locale}/guides`} style={{ textDecoration: "none" }}>
          ← {locale === "dk" ? "Guides" : "Guides"}
        </Link>
      </p>

      <h1 style={{ margin: "10px 0 8px" }}>{title}</h1>
      {t?.excerpt ? (
        <p style={{ margin: "0 0 14px", opacity: 0.8 }}>{t.excerpt}</p>
      ) : null}

      <article
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: 14,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {body ? renderPlain(body) : (
          <p style={{ opacity: 0.85 }}>
            {locale === "dk" ? "Tilføj body i DB." : "Add body in DB."}
          </p>
        )}
      </article>
    </main>
  );
}