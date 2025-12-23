// src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Forago",
  description: "Find, understand and use wild food — privacy-first.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
