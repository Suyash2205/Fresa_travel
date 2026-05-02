import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";

const PRODUCTS = [
  {
    name: "Mango Fruit Bites",
    tag: "Fan Favourite",
    desc: "Real freeze-dried Alphonso mango — no added sugar, no preservatives. Perfect travel snack.",
    price: "From ₹219",
    img: "https://www.fresafoods.in/cdn/shop/files/Mango.png?v=1759137956&width=400",
    category: "Fruits",
  },
  {
    name: "Paneer Butter Masala",
    tag: "Ready in 5 min",
    desc: "Restaurant-quality paneer butter masala. Just add hot water — ideal for hotel rooms abroad.",
    price: "₹269",
    img: "https://www.fresafoods.in/cdn/shop/files/Paneer_butter_masala_A_1.jpg?v=1762519638&width=400",
    category: "Meals",
  },
  {
    name: "Dal Khichdi",
    tag: "Ready in 5 min",
    desc: "A wholesome homestyle khichdi — the ultimate comfort food for travellers missing home cooking.",
    price: "₹269",
    img: "https://www.fresafoods.in/cdn/shop/files/Dal_Khichdi_A_1.jpg",
    category: "Meals",
  },
  {
    name: "Masala Chai",
    tag: "Taste of Home",
    desc: "Authentic masala chai blend. Brew a perfect cup anywhere in the world and feel right at home.",
    price: "₹449",
    img: "https://www.fresafoods.in/cdn/shop/files/Fresa_Chai_Images-18.png?v=1751977610&width=400",
    category: "Tea",
  },
  {
    name: "Pineapple Fruit Bites",
    tag: "No Added Sugar",
    desc: "Tangy, chewy freeze-dried pineapple bites. Lightweight, TSA-friendly, and full of flavour.",
    price: "From ₹199",
    img: "https://www.fresafoods.in/cdn/shop/files/Pineapple.png?v=1759138062&width=400",
    category: "Fruits",
  },
  {
    name: "Chole",
    tag: "Ready in 5 min",
    desc: "Spiced chickpea curry — a hearty meal solution when you're abroad and craving real Indian food.",
    price: "₹251",
    img: "https://www.fresafoods.in/cdn/shop/files/Chhole_A_1.jpg",
    category: "Meals",
  },
  {
    name: "Strawberry Fruit Bites",
    tag: "Kids Love It",
    desc: "Sweet freeze-dried strawberries — a healthy treat for the whole family on long journeys.",
    price: "From ₹199",
    img: "https://www.fresafoods.in/cdn/shop/files/Strawberry.png?v=1759139799&width=400",
    category: "Fruits",
  },
  {
    name: "Complete Fruit Delight",
    tag: "Best Value",
    desc: "A curated combo of 5 freeze-dried fruit varieties — perfect as a travel gift or a month's supply.",
    price: "₹1,285",
    img: "https://www.fresafoods.in/cdn/shop/files/Fusion_Pack_3.jpg",
    category: "Combo",
  },
];

const WHY = [
  { icon: "✈️", title: "Built for Travel", body: "Lightweight, TSA-approved, no refrigeration needed. Fresa products are made for travellers." },
  { icon: "🌿", title: "100% Real & Natural", body: "No added sugar, no preservatives, no artificial flavours. Just real food, freeze-dried." },
  { icon: "⚡", title: "Ready in 5 Minutes", body: "Full meals that need only hot water. Perfect for hotel rooms, long flights, or road trips." },
  { icon: "🏠", title: "Taste of Home Abroad", body: "Help your travellers carry the comfort of Indian food wherever they go in the world." },
];

const stateStyle: Record<string, string> = {
  DRAFT: "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
};

export default async function AgentDashboard() {
  const session = await requireRole("AGENT");
  const agent = await db.agent.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: {
      travellers: { select: { id: true } },
      orderReferrals: { select: { id: true, commissionAmount: true, travellerId: true } },
      statements: { orderBy: { month: "desc" }, take: 3 },
    },
  });

  const totalReferrals = agent.travellers.length;
  const totalOrdered = agent.orderReferrals.length;
  const notOrdered = totalReferrals - totalOrdered;
  const totalEarned = agent.orderReferrals.reduce((s, r) => s + Number(r.commissionAmount), 0);
  const statements = agent.statements as Array<{ id: string; month: Date; totalCommission: number | { toString(): string }; state: string }>;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Navbar */}
      <nav className="bg-[#1a2e1e] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="https://www.fresafoods.in/cdn/shop/files/fresa-new-logo.png?v=1740643169&width=300"
            alt="Fresa Foods"
            width={100}
            height={34}
            className="brightness-0 invert"
            unoptimized
          />
          <span className="hidden sm:flex items-center gap-4 ml-2">
            <span className="h-4 w-px bg-white/20" />
            <Link href="/agent/dashboard" className="text-xs font-semibold text-white/90 hover:text-white transition">Home</Link>
            <Link href="/agent/referrals" className="text-xs font-medium text-white/60 hover:text-white transition">My Referrals</Link>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-white/50">{agent.code}</span>
          <LogoutButton />
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-[#1a2e1e] px-6 pb-12 pt-10 text-white text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a8c9b0] mb-3">Partner Programme</p>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3 max-w-2xl mx-auto">
          Help your travellers eat well,<br />anywhere in the world.
        </h1>
        <p className="text-[#a8c9b0] text-sm max-w-xl mx-auto mb-8">
          Every time someone from your list orders on Fresa, you earn 5% commission — automatically, every month, for life.
        </p>

        {/* Stats row */}
        <div className="inline-grid grid-cols-2 sm:grid-cols-4 gap-3 mx-auto">
          {[
            { label: "Total Referrals", value: totalReferrals, icon: "✈️" },
            { label: "Orders Placed", value: totalOrdered, icon: "🛒", highlight: true },
            { label: "Yet to Order", value: notOrdered, icon: "⏳" },
            { label: "Commission Earned", value: `₹${totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`, icon: "💰", highlight: true },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl px-5 py-4 text-center min-w-[130px] ${s.highlight ? "bg-[#e06b2a]" : "bg-white/10"}`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/agent/referrals" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e06b2a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c85a20] transition">
            View My Referrals →
          </Link>
          <a href="https://www.fresafoods.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition">
            🌐 Visit Fresa Store
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-16">

        {/* Why Fresa */}
        <section>
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#e06b2a] mb-2">Why Recommend Fresa?</p>
            <h2 className="text-2xl font-bold text-[#1a130c]">Real food for real travellers</h2>
            <p className="text-sm text-[#7a6555] mt-2 max-w-lg mx-auto">
              Your clients travel the world — but they still want the taste of home. Fresa makes that possible.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl bg-white border border-[#e5d2ba] p-6">
                <div className="text-3xl mb-3">{w.icon}</div>
                <h3 className="font-semibold text-[#1a130c] mb-1">{w.title}</h3>
                <p className="text-xs text-[#7a6555] leading-relaxed">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section>
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#e06b2a] mb-2">What We Offer</p>
            <h2 className="text-2xl font-bold text-[#1a130c]">Share these with your travellers</h2>
            <p className="text-sm text-[#7a6555] mt-2 max-w-lg mx-auto">
              From ready-to-eat meals to freeze-dried fruits and authentic chai — everything your clients need for a great trip.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <a
                key={p.name}
                href="https://www.fresafoods.in"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl bg-white border border-[#e5d2ba] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="relative h-44 bg-[#fdf3ea] overflow-hidden">
                  <Image
                    src={p.img}
                    alt={p.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-[#1a2e1e] px-2.5 py-0.5 text-xs font-semibold text-white">
                    {p.tag}
                  </span>
                  <span className="absolute top-3 right-3 rounded-full bg-[#e06b2a]/10 border border-[#e06b2a]/20 px-2 py-0.5 text-xs text-[#e06b2a] font-medium">
                    {p.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[#1a130c] text-sm mb-1">{p.name}</h3>
                  <p className="text-xs text-[#7a6555] leading-relaxed mb-3">{p.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1a2e1e]">{p.price}</span>
                    <span className="text-xs text-[#e06b2a] font-semibold group-hover:underline">View →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a
              href="https://www.fresafoods.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#e5d2ba] bg-white px-6 py-3 text-sm font-semibold text-[#1a2e1e] hover:bg-[#fdf3ea] transition"
            >
              🛍️ See all products on Fresa →
            </a>
          </div>
        </section>

        {/* Motivation banner */}
        <section className="rounded-2xl bg-[#1a2e1e] text-white px-8 py-10 text-center">
          <p className="text-3xl mb-3">🌍</p>
          <h2 className="text-xl font-bold mb-2">Every referral is a life improved.</h2>
          <p className="text-[#a8c9b0] text-sm max-w-md mx-auto mb-6">
            When your travellers carry Fresa, they carry the taste of home. You help them eat better, feel better — and earn passive income doing it.
          </p>
          <Link href="/agent/referrals" className="inline-flex items-center gap-2 rounded-xl bg-[#e06b2a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c85a20] transition">
            View My Referrals →
          </Link>
        </section>

        {/* Recent statements */}
        {statements.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1a130c]">Recent Statements</h2>
              <Link href="/agent/referrals" className="text-xs text-[#e06b2a] font-semibold hover:underline">View all commissions →</Link>
            </div>
            <div className="rounded-2xl bg-white border border-[#e5d2ba] divide-y divide-[#f5ede0]">
              {statements.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm font-medium text-[#1a130c]">
                    {new Date(s.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                  <span className="text-sm font-bold text-[#1a2e1e]">
                    ₹{Number(s.totalCommission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateStyle[s.state] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {s.state}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[#e5d2ba] py-6 text-center text-xs text-[#7a6555]">
        <a href="https://www.fresafoods.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#e06b2a] transition">
          fresafoods.in
        </a>
        {" · "}Fresa Partner Portal · Real food for real travellers
      </footer>
    </div>
  );
}
