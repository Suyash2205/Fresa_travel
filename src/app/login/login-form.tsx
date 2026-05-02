"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: true, callbackUrl: "/" });
    setLoading(false);
    if (result?.error) setError("Invalid email or password.");
  }

  const inputClass =
    "w-full rounded-lg border border-[#e5d2ba] bg-white px-4 py-2.5 text-sm text-[#1a130c] placeholder:text-[#c0a88a] focus:border-[#e06b2a] focus:outline-none focus:ring-2 focus:ring-[#e06b2a]/20 transition";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#7a6555]">Email</label>
        <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#7a6555]">Password</label>
        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
      </div>
      {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#e06b2a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c85a20] disabled:opacity-60 transition">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
