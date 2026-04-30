import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await requireSession();
  if (session.user.role === UserRole.ADMIN) {
    redirect("/admin/dashboard");
  }
  redirect("/agent/dashboard");
}
