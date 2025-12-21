import { JsonLd } from "./JsonLd";

export function HowToJsonLd({
  name,
  steps,
}: {
  name: string;
  steps: { name: string; text: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name,
        step: steps.map((s) => ({
          "@type": "HowToStep",
          name: s.name,
          text: s.text,
        })),
      }}
    />
  );
}
