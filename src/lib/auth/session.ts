import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/config";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireSession();
  if (session.user.role !== role) {
    redirect("/");
  }
  return session;
}
