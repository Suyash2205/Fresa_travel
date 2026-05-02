"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-[#e0ccea] px-4 py-2 text-xs font-semibold text-[#6b5f7a] hover:bg-[#f3eaf8] hover:text-[#442037] transition"
    >
      Sign out
    </button>
  );
}
