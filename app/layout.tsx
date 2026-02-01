import "./globals.css";
import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import Script from "next/script";

export const metadata: Metadata = {
  title: "LinkShrink",
  description: "Shorten links and track clicks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
        <Script
  async
  strategy="afterInteractive"
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2609478919998844"
  crossOrigin="anonymous"
/>
        <TopNav />
        {children}

        <footer className="mx-auto max-w-5xl px-4 pb-10 pt-8 text-sm text-slate-500">
  <div className="border-t border-slate-200 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p>© {new Date().getFullYear()} LinkShrink</p>

    <div className="flex gap-4">
      <a href="/privacy" className="hover:text-slate-700 hover:underline">
        Privacy
      </a>
      <a href="/terms" className="hover:text-slate-700 hover:underline">
        Terms
      </a>
    </div>
  </div>
</footer>
      </body>
    </html>
  );
}