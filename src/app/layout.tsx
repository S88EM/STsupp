import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { Locale } from "@/lib/i18n/types";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "STsup — Швидкий трекер завдань | Task Tracker",
  description: "Легкий, швидкий self-hosted трекер завдань у стилі Linear для команд | Lightweight self-hosted agile task tracker & Service Desk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const initialTheme = cookieStore.get("stsup_theme")?.value || "default";
  const initialLang = (cookieStore.get("stsup_lang")?.value as Locale) || "uk";
  const isLight = initialTheme.startsWith("light-");

  return (
    <html lang={initialLang} className={isLight ? "light" : "dark"} data-bg={initialTheme}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('stsup_theme');
                if (saved) {
                  document.documentElement.setAttribute('data-bg', saved);
                  if (saved.indexOf('light-') === 0) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  }
                }
                var savedLang = localStorage.getItem('stsup_lang');
                if (savedLang) {
                  document.documentElement.setAttribute('lang', savedLang);
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <I18nProvider initialLocale={initialLang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
