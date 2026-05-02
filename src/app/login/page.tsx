import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/config";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#442037] px-12 text-white">
        <Image
          src="https://www.fresafoods.in/cdn/shop/files/fresa-new-logo.png?v=1740643169&width=300"
          alt="Fresa Foods"
          width={180}
          height={60}
          className="mb-10 brightness-0 invert"
          unoptimized
        />
        <h2 className="text-3xl font-bold leading-snug text-center mb-4">
          Partner Referral Portal
        </h2>
        <p className="text-center text-[#d4b8dc] text-sm leading-relaxed max-w-xs">
          Track your referrals, monitor order conversions, and receive monthly commission payouts — all in one place.
        </p>
        <div className="mt-12 grid grid-cols-3 gap-6 text-center w-full max-w-sm">
          {[
            { label: "Referrals", desc: "Track your travellers" },
            { label: "Orders", desc: "See who converted" },
            { label: "Payouts", desc: "Monthly statements" },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-xs font-semibold text-[#d4b8dc] uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-xs text-white/70">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f8f3fb] px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 lg:hidden">
            <Image
              src="https://www.fresafoods.in/cdn/shop/files/fresa-new-logo.png?v=1740643169&width=300"
              alt="Fresa Foods"
              width={140}
              height={48}
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1523] mb-1">Welcome back</h1>
          <p className="text-sm text-[#6b5f7a] mb-8">Sign in to your partner account</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
