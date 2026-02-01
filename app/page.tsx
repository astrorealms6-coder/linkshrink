"use client";

import { useEffect, useMemo, useState } from "react";
import * as QRCode from "qrcode";

export default function HomePage() {
  const [longUrl, setLongUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [showAlias, setShowAlias] = useState(false);

  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const normalizedOriginal = useMemo(() => {
    const t = longUrl.trim();
    if (!t) return "";
    if (t.startsWith("http://") || t.startsWith("https://")) return t;
    return `https://${t}`;
  }, [longUrl]);

  async function onShorten() {
    setLoading(true);
    setErr(null);
    setShortUrl(null);
    setQrDataUrl(null);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          longUrl,
          customCode: showAlias ? (customCode.trim() || undefined) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setShortUrl(data.shortUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function makeQr() {
      if (!shortUrl) return;
      const url = await QRCode.toDataURL(shortUrl, {
        margin: 2,
        width: 520,
        errorCorrectionLevel: "M",
      });
      if (!cancelled) setQrDataUrl(url);
    }

    makeQr().catch(() => setQrDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [shortUrl]);

  async function copy() {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    alert("Copied!");
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-14">
        {/* HERO ICON */}
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-blue-600 text-white shadow-[0_18px_55px_rgba(37,99,235,0.28)]">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
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

        {/* HERO TEXT */}
        <h1 className="mt-8 text-center text-4xl font-extrabold tracking-tight sm:text-6xl">
          Shorten Your Links
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-slate-600 sm:text-lg">
          Create short, memorable links in seconds. Track clicks and share with confidence.
        </p>

        {/* MAIN CARD */}
        <section className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h2 className="text-center text-2xl font-extrabold">Shorten Your URL</h2>
          <p className="mt-2 text-center text-slate-600">
            Paste your long URL and get a short, shareable link
          </p>

          <div className="mt-7">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-blue-600 placeholder:text-slate-400 focus:ring-2"
              placeholder="https://example.com/your-long-url-here"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAlias((s) => !s)}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
          >
            <span className="text-lg leading-none">{showAlias ? "▾" : "▸"}</span>
            Custom alias (optional)
          </button>

          {showAlias && (
            <div className="mt-3">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-blue-600 placeholder:text-slate-400 focus:ring-2"
                placeholder="my-custom-link"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
              />
              <p className="mt-2 text-xs text-slate-500">Leave empty to generate a random short code</p>
            </div>
          )}

          {err && <p className="mt-4 text-sm font-semibold text-red-600">{err}</p>}

          <button
            type="button"
            onClick={onShorten}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
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
            {loading ? "Working..." : "Shorten URL"}
          </button>
        </section>

        {/* SUCCESS CARD (optional) */}
        {shortUrl && (
          <section className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-10">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="mt-4 text-center text-2xl font-extrabold text-emerald-900">
              Your shortened URL is ready!
            </h3>
            <p className="mt-2 text-center text-emerald-900/70">Share this link anywhere</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-3 font-mono text-sm text-slate-900">
                {shortUrl}
              </div>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                Copy
              </button>
            </div>

            <div className="mt-6 border-t border-emerald-200 pt-6 text-left">
              <p className="text-sm font-semibold text-emerald-900">Original URL</p>
              <a
                href={normalizedOriginal || "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-blue-700 hover:underline"
              >
                {normalizedOriginal}
              </a>

              <div className="mt-6 flex flex-col items-center">
                {qrDataUrl && (
                  <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                    <img src={qrDataUrl} alt="QR" className="h-56 w-56 rounded-xl" />
                  </div>
                )}

                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`linkshrink-${(customCode.trim() || "qr").replace(/[^a-zA-Z0-9_-]/g, "")}.png`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Download QR
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FEATURES (3 columns on desktop) */}
        <section className="mx-auto mt-14 max-w-5xl">
          <div className="grid gap-10 text-center sm:grid-cols-3">
            <Feature
              title="Lightning Fast"
              desc="Create shortened links instantly with our optimized platform"
              iconBg="bg-violet-100"
              icon="⚡"
            />
            <Feature
              title="Track Analytics"
              desc="Monitor click counts and engagement for all your links"
              iconBg="bg-sky-100"
              icon="📈"
            />
            <Feature
              title="Secure & Reliable"
              desc="Your links are safe and available 24/7 with our infrastructure"
              iconBg="bg-emerald-100"
              icon="🛡️"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  title,
  desc,
  icon,
  iconBg,
}: {
  title: string;
  desc: string;
  icon: string;
  iconBg: string;
}) {
  return (
    <div>
      <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${iconBg}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="mt-4 text-xl font-extrabold">{title}</h3>
      <p className="mt-2 text-slate-600">{desc}</p>
    </div>
  );
}