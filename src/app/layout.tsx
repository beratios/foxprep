import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://foxprepcenter.com"),
  title: "FoxPrep — Amazon FBA, Walmart WFS & FBM prep center in Hamilton, Ontario",
  description:
    "Posted per-unit prices for FNSKU labeling, poly bagging, bundling and pallet work. Your supplier ships to Hamilton, we ship to Amazon and Walmart.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
