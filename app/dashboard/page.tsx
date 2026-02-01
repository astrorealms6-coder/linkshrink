"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebaseClient";

type LinkRow = {
  id: string;
  code: string;
  longUrl: string;
  clicks: number;
  createdAt: string;
};

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  // search
  const [q, setQ] = useState("");

  // create modal
  const [open, setOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setLoggedIn(!!u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  async function getToken() {
    const u = auth.currentUser;
    if (!u) return null;
    return await u.getIdToken();
  }

  async function load() {
    setLoading(true);

    const token = await getToken();
    if (!token) {
      setLinks([]);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/links", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLinks([]);
      setLoading(false);
      return;
    }

    setLinks(data.links || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!ready) return;
    if (!loggedIn) {
      setLinks([]);
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loggedIn]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return links;
    return links.filter((l) => l.code.toLowerCase().includes(s) || l.longUrl.toLowerCase().includes(s));
  }, [links, q]);

  const totalLinks = links.length;
  const totalClicks = useMemo(() => links.reduce((sum, l) => sum + (l.clicks || 0), 0), [links]);
  const avg = totalLinks ? totalClicks / totalLinks : 0;

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  }

  async function del(code: string) {
    const token = await getToken();
    if (!token) return;

    if (!confirm(`Delete /${code} ?`)) return;

    const res = await fetch(`/api/links/${encodeURIComponent(code)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || "Delete failed");
      return;
    }

    setLinks((prev) => prev.filter((l) => l.code !== code));
  }

  async function createLink() {
    setCreating(true);
    setCreateErr(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Please login first.");

      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          longUrl: newUrl,
          customCode: newAlias.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Create failed");

      await load();
      setOpen(false);
      setNewUrl("");
      setNewAlias("");
    } catch (e) {
      setCreateErr(e instanceof Error ? e.message : "Error");
    } finally {
      setCreating(false);
    }
  }

  // If not logged in: show message
  if (ready && !loggedIn) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold">Dashboard</h1>
          <p className="mt-2 text-slate-600">Please login to view and manage your links.</p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header row */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">My Links</h1>
          <p className="mt-2 text-slate-600">Manage and track your shortened URLs</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <span className="text-lg leading-none">＋</span>
          Create New Link
        </button>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Links" value={String(totalLinks)} />
        <StatCard title="Total Clicks" value={String(totalClicks)} valueClass="text-blue-600" />
        <StatCard title="Avg Clicks/Link" value={avg.toFixed(1)} valueClass="text-violet-600" />
      </div>

      {/* Search */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500">
            <SearchIcon />
          </div>

          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
            placeholder="Search links..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button
            onClick={load}
            className="hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:inline-flex"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-slate-900">Links</h2>
            <p className="text-sm text-slate-600">
              Showing {filtered.length} of {links.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-slate-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-slate-600">No links found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Short URL</Th>
                  <Th>Original URL</Th>
                  <Th>Clicks</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((l) => {
                  const short = `${baseUrl}/${l.code}`;

                  return (
                    <tr key={l.id} className="border-t border-slate-100">
                      <Td>
                        <a
                          href={`/${l.code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit rounded-lg bg-blue-50 px-3 py-1.5 font-mono text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          /{l.code}
                        </a>
                      </Td>

                      <Td>
                        <a
                          href={l.longUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-[560px] truncate text-blue-700 hover:underline"
                          title={l.longUrl}
                        >
                          {l.longUrl}
                        </a>
                      </Td>

                      <Td>
                        <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
                          <MiniChartIcon />
                          {l.clicks}
                        </span>
                      </Td>

                      <Td className="text-slate-600">{formatDate(l.createdAt)}</Td>

                      <Td className="text-right">
                        <div className="inline-flex items-center gap-3">
                          <a
                            href={`/stats/${l.code}`}
                            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                            title="Stats"
                          >
                            <EyeIcon />
                          </a>

                          <button
                            onClick={() => copy(short)}
                            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                            title="Copy"
                          >
                            <CopyIcon />
                          </button>

                          <a
                            href={l.longUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                            title="Open original"
                          >
                            <ExternalIcon />
                          </a>

                          <button
                            onClick={() => del(l.code)}
                            className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold">Create New Link</h3>
                <p className="mt-1 text-sm text-slate-600">Shorten a new URL from the dashboard.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">Long URL</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
                placeholder="https://example.com/very/long"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700">Custom alias (optional)</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
                placeholder="mycustomlink"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
              />
              <p className="mt-2 text-xs text-slate-500">Allowed: letters, numbers, - and _ (3–40 chars)</p>
            </div>

            {createErr && <p className="mt-3 text-sm font-semibold text-red-600">{createErr}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={createLink}
                disabled={creating}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  valueClass = "text-slate-900",
}: {
  title: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className={`mt-4 text-4xl font-extrabold ${valueClass}`}>{value}</p>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-sm font-bold text-slate-700 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-4 align-top ${className}`}>{children}</td>;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

/* Icons */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function MiniChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 15v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 15V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 15v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 9h10v10H9V9Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 3h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 3l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10 7H7a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}