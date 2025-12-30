import { Suspense } from "react";
import ConfirmClient from "./ConfirmClient";

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Bekræfter…</div>}>
      <ConfirmClient />
    </Suspense>
  );
}
