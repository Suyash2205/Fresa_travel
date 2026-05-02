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
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#1a2e1e] px-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.fresafoods.in/cdn/shop/files/Fusion_Pack_3.jpg')] bg-cover bg-center" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <Image
            src="https://www.fresafoods.in/cdn/shop/files/fresa-new-logo.png?v=1740643169&width=300"
            alt="Fresa Foods"
            width={160}
            height={54}
            className="mb-10 brightness-0 invert"
            unoptimized
          />
          <h2 className="text-3xl font-bold leading-snug mb-4">Partner Referral Portal</h2>
          <p className="text-[#a8c9b0] text-sm leading-relaxed max-w-xs mb-10">
            Help your travellers taste India wherever they go — and earn a 5% commission on every order they place, for life.
          </p>
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            {[
              { icon: "✈️", label: "Track Referrals" },
              { icon: "🛒", label: "Monitor Orders" },
              { icon: "💰", label: "Earn Commission" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-xs text-white/70 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#faf8f5] px-6 py-12">
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
          <h1 className="text-2xl font-bold text-[#1a130c] mb-1">Welcome back</h1>
          <p className="text-sm text-[#7a6555] mb-8">Sign in to your partner account</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
