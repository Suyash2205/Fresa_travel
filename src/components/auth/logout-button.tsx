"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
    >
      Sign out
    </button>
  );
}
