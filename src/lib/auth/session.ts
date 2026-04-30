import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/config";

type AppRole = "ADMIN" | "AGENT";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireSession();
  if (session.user.role !== role) {
    redirect("/");
  }
  return session;
}
