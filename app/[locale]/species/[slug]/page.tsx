import styles from "./SpeciesPage.module.css";
import { SafetyCallout } from "@/components/Species/SafetyCallout";
import { Lookalikes } from "@/components/Species/Lookalikes";
import { BreadcrumbsJsonLd } from "@/components/SEO/BreadcrumbsJsonLd";
import { FAQJsonLd } from "@/components/SEO/FAQJsonLd";
import { HowToJsonLd } from "@/components/SEO/HowToJsonLd";
import { baseMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

type Props = { params: { locale: string; slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${base}/${params.locale}/species/${params.slug}`;

  const title = `${params.slug.replace(/-/g, " ")} · Species · Forago`;
  return baseMetadata({
    title,
    description: "Identification, look-alikes, seasonality, and safe use.",
    url,
    locale: params.locale,
    hreflangs: [],
  });
}

export default function SpeciesPage({ params }: Props) {
  const slug = params.slug;

  const faqs = [
    { q: "How do I identify this safely?", a: "Use multiple traits, habitat, and look-alikes. Never rely on one photo." },
    { q: "Do you share exact spots?", a: "No. Forago stores only coarse cells to protect nature and community trust." },
  ];

  const howtoSteps = [
    { name: "Check season", text: "Confirm month window in your country/region." },
    { name: "Verify traits", text: "Use 3+ identifying traits (not just color)." },
    { name: "Compare look-alikes", text: "Actively rule out poisonous/confusing species." },
    { name: "Start small", text: "If edible, try a small amount first and follow local guidance." },
  ];

  return (
    <div className={styles.wrap}>
      <BreadcrumbsJsonLd
        items={[
          { name: "Forago", url: `/${params.locale}` },
          { name: "Species", url: `/${params.locale}/species` },
          { name: slug, url: `/${params.locale}/species/${slug}` },
        ]}
      />
      <FAQJsonLd items={faqs} />
      <HowToJsonLd
        name={`How to identify ${slug}`}
        steps={howtoSteps}
      />

      <div className={styles.hero}>
        <div>
          <h1 className={styles.h1}>{slug.replace(/-/g, " ")}</h1>
          <p className={styles.sub}>
            Canonical species page (SEO-first). Replace demo text with Supabase content.
          </p>
        </div>
        <div className={styles.badge}>DK-ready</div>
      </div>

      <SafetyCallout
        level="warn"
        title="Safety-first"
        body="Always rule out look-alikes. When in doubt, don’t consume."
      />

      <section className={styles.section}>
        <h2 className={styles.h2}>Key traits</h2>
        <div className={styles.card}>
          <ul className={styles.list}>
            <li>Trait 1: shape / underside</li>
            <li>Trait 2: smell / bruising</li>
            <li>Trait 3: habitat / season window</li>
          </ul>
        </div>
      </section>

      <Lookalikes
        items={[
          { name: "Look-alike A", risk: "bad", note: "Poisonous in some cases." },
          { name: "Look-alike B", risk: "warn", note: "Common confusion; learn differences." },
        ]}
      />

      <section className={styles.section}>
        <h2 className={styles.h2}>How to use</h2>
        <div className={styles.card}>
          <p className={styles.p}>
            Keep culinary guidance calm and practical. Provide 2–3 safe starter uses and
            preparation notes.
          </p>
        </div>
      </section>
    </div>
  );
}
