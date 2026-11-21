import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { getI18n } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("meta.title", "FoxPrep — Amazon FBA, Walmart WFS & FBM prep center in Hamilton, Ontario"),
    description: t(
      "meta.description",
      "Posted per-unit prices for FNSKU labeling, poly bagging, bundling and pallet work. Your supplier ships to Hamilton, we ship to Amazon and Walmart.",
    ),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dir, messages } = await getI18n();
  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen font-sans">
        <I18nProvider locale={locale} messages={messages}>{children}</I18nProvider>
      </body>
    </html>
  );
}
