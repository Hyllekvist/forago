// src/app/[locale]/callback/page.tsx
import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CallbackPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Logger ind…</div>}>
      <CallbackClient />
    </Suspense>
  );
}