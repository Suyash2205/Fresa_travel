import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await requireSession();
  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }
  redirect("/agent/dashboard");
}
