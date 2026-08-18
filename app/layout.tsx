import type { Metadata } from "next";
import "./globals.css";
import { COMPANY_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `${COMPANY_NAME} — Amazon & eBay Prep Center`,
  description: "Transparent per-unit and per-order prep & fulfillment pricing, Greater Toronto Area.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
