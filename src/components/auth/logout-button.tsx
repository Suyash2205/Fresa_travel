"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md border border-[#fd8756] px-3 py-1.5 text-sm font-medium text-[#fd8756] hover:bg-[#fff1eb]"
    >
      Logout
    </button>
  );
}
