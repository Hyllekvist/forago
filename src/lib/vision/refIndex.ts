import type { RefItem } from "./types";

export const REF_ITEMS: RefItem[] = [
  {
    slug: "kantarel",
    name: "Kantarel",
    latin: "Cantharellus cibarius",
    imageUrl: "/demo_refs/kantarel.jpg", // <- læg selv billeder i public/demo_refs/ eller brug jeres URLs
    checks: [
      { id: "ridges", label: "Gule, nedløbende ribber (ikke lameller)" },
      { id: "funnel", label: "Tragtformet hat" },
      { id: "smell", label: "Frugtagtig duft" },
    ],
  },
  {
    slug: "falsk-kantarel",
    name: "Falsk kantarel",
    latin: "Hygrophoropsis aurantiaca",
    imageUrl: "/demo_refs/falsk_kantarel.jpg",
    checks: [
      { id: "gills", label: "Tætte lameller" },
      { id: "orange", label: "Mere orange farve" },
      { id: "wood", label: "Vokser ofte på dødt træ/strøelse" },
    ],
  },
];
