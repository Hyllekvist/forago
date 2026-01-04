// src/app/[locale]/scan/page.tsx 
import type { Metadata } from "next";
import ScanClient from "./ScanClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scan arter | Forago",
  description: "Scan et billede og få et kvalificeret bud på hvilke arter du ser.",
};

export default function ScanPage() {
  return <ScanClient />;
}