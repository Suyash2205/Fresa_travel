import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/config";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f5] p-6">
      <div className="w-full max-w-md rounded-xl border border-[#ffd8c8] bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-[#1e1e1e]">Partner Portal Login</h1>
        <p className="mb-6 text-sm text-[#3f3f3f]">Use your Fresa partner credentials to continue.</p>
        <LoginForm />
      </div>
    </div>
  );
}
