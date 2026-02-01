"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";

export default function TopNav() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/stats");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-lg">LinkShrink</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={
              isDashboard
                ? "inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h7v7H4V4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M13 4h7v7h-7V4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M4 13h7v7H4v-7Z" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13h7v7h-7v-7Z" stroke="currentColor" strokeWidth="2" />
            </svg>
            Dashboard
          </Link>

          <AuthButton />
        </nav>
      </div>
    </header>
  );
}