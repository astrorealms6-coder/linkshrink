"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../lib/firebaseClient";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const initials = useMemo(() => {
    const name = user?.displayName || user?.email || "";
    const parts = name.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts.length > 1 ? parts[1]?.[0] : (parts[0]?.[1] ?? "");
    return (a + b).toUpperCase();
  }, [user]);

  async function login() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
    setOpen(false);
  }

  if (loading) {
    return (
      <button
        type="button"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
      >
        ...
      </button>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={login}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        Login
      </button>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white text-sm font-extrabold text-slate-700 hover:bg-slate-50"
        aria-label="Profile"
        title={user.email ?? ""}
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center">{initials}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">Signed in as</p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-900">
              {user.email}
            </p>
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              onClick={logout}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}