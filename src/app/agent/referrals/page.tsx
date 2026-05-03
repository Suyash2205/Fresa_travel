import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { FilterBar } from "./filter-bar";

type Referral = {
  id: string;
  travellerId: string;
  commissionAmount: number | { toString(): string };
  commissionBase: number | { toString(): string };
  status: string;
  createdAt: Date;
  order: { orderNumber: string | null; shopifyOrderId: string; createdAtShopify: Date };
  traveller: { id: string; name: string | null; email: string | null; phone: string | null };
};

type Traveller = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
};

const stateStyle: Record<string, string> = {
  DRAFT: "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  ORDERED: "bg-green-50 text-green-700 border-green-200",
};

function mkKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function keyLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function keyShort(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default async function AgentReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; customer?: string }>;
}) {
  const { month: filterMonth = "", customer: filterCustomer = "" } = await searchParams;

  const session = await requireRole("AGENT");
  const agent = await db.agent.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: {
      travellers: { orderBy: { createdAt: "desc" } },
      orderReferrals: {
        include: { order: true, traveller: true },
        orderBy: { createdAt: "desc" },
      },
      statements: { orderBy: { month: "desc" } },
    },
  });

  const allTravellers = agent.travellers as Traveller[];
  const allReferrals = agent.orderReferrals as Referral[];
  const statements = agent.statements as Array<{
    id: string; month: Date; totalCommission: number | { toString(): string }; state: string;
  }>;

  // Filter referrals
  const referrals = allReferrals.filter((r) => {
    const monthMatch = filterMonth ? mkKey(new Date(r.order.createdAtShopify)) === filterMonth : true;
    const customerMatch = filterCustomer ? r.travellerId === filterCustomer : true;
    return monthMatch && customerMatch;
  });

  // Filter travellers list too (if customer filter active, show only that person)
  const travellers = filterCustomer
    ? allTravellers.filter((t) => t.id === filterCustomer)
    : allTravellers;

  const orderedIds = new Set(allReferrals.map((r) => r.travellerId));
  const totalEarned = referrals.reduce((s, r) => s + Number(r.commissionAmount), 0);
  const allTimeEarned = allReferrals.reduce((s, r) => s + Number(r.commissionAmount), 0);

  // Build month options from actual order data (unique months, descending)
  const allMonthKeys = [...new Set(allReferrals.map((r) => mkKey(new Date(r.order.createdAtShopify))))].sort().reverse();
  const monthOptions = allMonthKeys.map((key) => ({ key, label: keyLabel(key) }));

  // Customer options — only travellers who have ordered
  const customerOptions = allReferrals.map((r) => ({
    id: r.travellerId,
    name: r.traveller.name || r.traveller.email || r.traveller.phone || "Unknown",
  })).filter((v, i, arr) => arr.findIndex((a) => a.id === v.id) === i);

  // Monthly bar chart data — last 6 months (unfiltered by customer, filtered by customer if set)
  const chartReferrals = filterCustomer ? allReferrals.filter((r) => r.travellerId === filterCustomer) : allReferrals;
  const monthMap = new Map<string, number>();
  for (const r of chartReferrals) {
    const key = mkKey(new Date(r.order.createdAtShopify));
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(r.commissionAmount));
  }
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => mkKey(new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)));
  const monthlyData = last6.map((key) => ({ key, label: keyShort(key), amount: monthMap.get(key) ?? 0 }));
  const maxMonthly = Math.max(...monthlyData.map((m) => m.amount), 1);

  const thisMonthKey = mkKey(now);
  const thisMonthEarned = monthMap.get(thisMonthKey) ?? 0;

  // Per-referral breakdown (filtered by month if set)
  const perReferral = referrals.map((r) => ({
    id: r.travellerId,
    name: r.traveller.name || r.traveller.email || r.traveller.phone || "Unknown",
    commission: Number(r.commissionAmount),
    orderValue: Number(r.commissionBase),
    orderNum: r.order.orderNumber || r.order.shopifyOrderId,
  })).sort((a, b) => b.commission - a.commission);
  const maxRef = Math.max(...perReferral.map((p) => p.commission), 1);

  const conversionRate = allTravellers.length
    ? Math.round((new Set(allReferrals.map((r) => r.travellerId)).size / allTravellers.length) * 100)
    : 0;

  const isFiltered = !!(filterMonth || filterCustomer);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <nav className="bg-[#1a2e1e] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="https://www.fresafoods.in/cdn/shop/files/fresa-new-logo.png?v=1740643169&width=300" alt="Fresa Foods" width={100} height={34} className="brightness-0 invert" unoptimized />
          <span className="hidden sm:flex items-center gap-4 ml-2">
            <span className="h-4 w-px bg-white/20" />
            <Link href="/agent/dashboard" className="text-xs font-medium text-white/60 hover:text-white transition">Home</Link>
            <Link href="/agent/referrals" className="text-xs font-semibold text-white/90 hover:text-white transition">My Referrals</Link>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-white/50">{agent.code}</span>
          <LogoutButton />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-5">
        <div>
          <Link href="/agent/dashboard" className="text-xs text-[#e06b2a] font-semibold hover:underline mb-2 inline-block">← Back to Dashboard</Link>
          <h1 className="text-xl font-bold text-[#1a130c]">My Referrals & Earnings</h1>
          <p className="text-sm text-[#7a6555]">
            {allTravellers.length} referrals · {allReferrals.length} orders ·
            {" "}₹{allTimeEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })} total earned
          </p>
        </div>

        {/* Filter bar */}
        <Suspense>
          <FilterBar
            monthOptions={monthOptions}
            customerOptions={customerOptions}
            currentMonth={filterMonth}
            currentCustomer={filterCustomer}
          />
        </Suspense>

        {/* Active filter banner */}
        {isFiltered && (
          <div className="rounded-xl bg-[#fdf3ea] border border-[#e5d2ba] px-4 py-3 text-sm text-[#7a6555] flex items-center justify-between">
            <span>
              Showing{" "}
              <strong className="text-[#1a130c]">
                {referrals.length} order{referrals.length !== 1 ? "s" : ""}
              </strong>
              {filterMonth && <> in <strong className="text-[#1a130c]">{keyLabel(filterMonth)}</strong></>}
              {filterCustomer && <> for <strong className="text-[#1a130c]">{customerOptions.find(c => c.id === filterCustomer)?.name}</strong></>}
            </span>
            <Link href="/agent/referrals" className="text-xs font-semibold text-[#e06b2a] hover:underline">View all</Link>
          </div>
        )}

        {/* ── KPI CARDS ── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: isFiltered ? "Filtered Earnings" : "Total Earned", value: `₹${totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, sub: isFiltered ? "Based on current filter" : "All time", highlight: true },
            { label: "This Month", value: `₹${thisMonthEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, sub: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) },
            { label: "Orders in View", value: referrals.length, sub: `of ${allReferrals.length} total` },
            { label: "Conversion Rate", value: `${conversionRate}%`, sub: `${new Set(allReferrals.map(r => r.travellerId)).size} of ${allTravellers.length} ordered` },
          ].map((k) => (
            <div key={k.label} className={`rounded-2xl border px-5 py-4 ${k.highlight ? "bg-[#1a2e1e] border-[#2a4a2e]" : "bg-white border-[#e5d2ba]"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${k.highlight ? "text-[#a8c9b0]" : "text-[#7a6555]"}`}>{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.highlight ? "text-white" : "text-[#1a2e1e]"}`}>{k.value}</p>
              <p className={`text-xs mt-0.5 ${k.highlight ? "text-[#a8c9b0]/70" : "text-[#7a6555]/70"}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Monthly earnings */}
          <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#1a130c] mb-0.5">Monthly Earnings</h2>
            <p className="text-xs text-[#7a6555] mb-5">
              {filterCustomer ? `For ${customerOptions.find(c => c.id === filterCustomer)?.name} — last 6 months` : "All referrals — last 6 months"}
            </p>
            <div className="space-y-3">
              {monthlyData.map((m) => {
                const isSelected = filterMonth === m.key;
                const isCurrent = m.key === thisMonthKey;
                return (
                  <Link key={m.key} href={`?${new URLSearchParams({ ...(filterCustomer ? { customer: filterCustomer } : {}), month: isSelected ? "" : m.key }).toString()}`}>
                    <div className="flex items-center gap-3 group cursor-pointer">
                      <span className={`text-xs w-12 shrink-0 font-medium transition ${isSelected ? "text-[#e06b2a]" : "text-[#7a6555] group-hover:text-[#1a130c]"}`}>{m.label}</span>
                      <div className="flex-1 bg-[#f5ede0] rounded-full h-7 overflow-hidden group-hover:bg-[#eee0cc] transition">
                        <div
                          className="h-7 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                          style={{
                            width: m.amount > 0 ? `${Math.max((m.amount / maxMonthly) * 100, 5)}%` : "0%",
                            background: isSelected ? "#e06b2a" : isCurrent ? "#2d5a3d" : "#1a2e1e",
                            opacity: filterMonth && !isSelected ? 0.4 : 1,
                          }}
                        >
                          {m.amount > 0 && <span className="text-xs font-semibold text-white whitespace-nowrap">₹{m.amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>}
                        </div>
                      </div>
                      {m.amount === 0 && <span className="text-xs text-[#7a6555]/40">—</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
            <p className="mt-4 pt-3 border-t border-[#f5ede0] text-xs text-[#7a6555]">
              Click a month bar to filter · {filterMonth ? <Link href={`?${filterCustomer ? `customer=${filterCustomer}` : ""}`} className="text-[#e06b2a] font-semibold hover:underline">Clear month filter</Link> : "Click to drill down"}
            </p>
          </div>

          {/* Per-referral breakdown */}
          <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#1a130c] mb-0.5">Earnings by Customer</h2>
            <p className="text-xs text-[#7a6555] mb-5">
              {filterMonth ? `In ${keyLabel(filterMonth)}` : "All time"} — click a bar to filter
            </p>
            {perReferral.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#7a6555]">
                {isFiltered ? "No orders match the current filter." : "No orders matched yet."}
              </div>
            ) : (
              <div className="space-y-3">
                {perReferral.slice(0, 7).map((p, i) => {
                  const isSelected = filterCustomer === p.id;
                  return (
                    <Link key={p.id} href={`?${new URLSearchParams({ ...(filterMonth ? { month: filterMonth } : {}), customer: isSelected ? "" : p.id }).toString()}`}>
                      <div className="flex items-center gap-3 group cursor-pointer">
                        <span className={`text-xs w-24 shrink-0 truncate font-medium transition ${isSelected ? "text-[#e06b2a]" : "text-[#7a6555] group-hover:text-[#1a130c]"}`} title={p.name}>{p.name}</span>
                        <div className="flex-1 bg-[#f5ede0] rounded-full h-7 overflow-hidden group-hover:bg-[#eee0cc] transition">
                          <div
                            className="h-7 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                            style={{
                              width: `${Math.max((p.commission / maxRef) * 100, 5)}%`,
                              background: isSelected ? "#e06b2a" : i === 0 ? "#2d5a3d" : "#1a2e1e",
                              opacity: filterCustomer && !isSelected ? 0.4 : 1,
                            }}
                          >
                            <span className="text-xs font-semibold text-white whitespace-nowrap">₹{p.commission.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-[#f5ede0] flex justify-between text-xs text-[#7a6555]">
              <span>{new Set(allReferrals.map(r => r.travellerId)).size} of {allTravellers.length} converted · {conversionRate}% rate</span>
              {filterCustomer && <Link href={`?${filterMonth ? `month=${filterMonth}` : ""}`} className="text-[#e06b2a] font-semibold hover:underline">Clear</Link>}
            </div>
          </div>
        </div>

        {/* ── REFERRAL LIST ── */}
        <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5ede0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1a130c]">Referral List {isFiltered && <span className="ml-1 text-[#e06b2a]">· filtered</span>}</h2>
              <p className="text-xs text-[#7a6555] mt-0.5">All people in your referral list.</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 text-xs font-semibold">{orderedIds.size} ordered</span>
              <span className="rounded-full bg-[#fdf3ea] border border-[#e5d2ba] text-[#7a6555] px-2.5 py-1 text-xs font-semibold">{allTravellers.length - orderedIds.size} pending</span>
            </div>
          </div>
          {travellers.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#7a6555]">No referrals match the current filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f5ede0] bg-[#fdf8f5]">
                    {["Name", "Email", "Phone", "Added on", "Status"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#7a6555]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fdf3ea]">
                  {travellers.map((t) => {
                    const ordered = orderedIds.has(t.id);
                    const isSelected = filterCustomer === t.id;
                    return (
                      <tr key={t.id} className={`hover:bg-[#fdf8f5] transition ${isSelected ? "bg-[#fdf3ea]" : ""}`}>
                        <td className="px-6 py-3.5 font-medium text-[#1a130c]">{t.name || "—"}</td>
                        <td className="px-6 py-3.5 text-[#7a6555]">{t.email || "—"}</td>
                        <td className="px-6 py-3.5 text-[#7a6555]">{t.phone || "—"}</td>
                        <td className="px-6 py-3.5 text-[#7a6555] text-xs">{new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="px-6 py-3.5">
                          {ordered
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">✓ Ordered</span>
                            : <span className="inline-flex items-center rounded-full bg-[#fdf3ea] border border-[#e5d2ba] px-2.5 py-0.5 text-xs font-semibold text-[#7a6555]">Pending</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commission transactions */}
        <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5ede0]">
            <h2 className="text-sm font-semibold text-[#1a130c]">Commission Transactions {isFiltered && <span className="ml-1 text-[#e06b2a]">· filtered</span>}</h2>
            <p className="text-xs text-[#7a6555] mt-0.5">5% of each matched order value.</p>
          </div>
          {referrals.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#7a6555]">No transactions match the current filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f5ede0] bg-[#fdf8f5]">
                    {[["Customer","left"],["Order #","left"],["Date","left"],["Order Value","right"],["Your Commission","right"],["Status","left"]].map(([h,a]) => (
                      <th key={h} className={`px-6 py-3 text-${a} text-xs font-semibold uppercase tracking-wider text-[#7a6555]`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fdf3ea]">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fdf8f5] transition">
                      <td className="px-6 py-3.5 font-medium text-[#1a130c]">{r.traveller.name || r.traveller.email || r.traveller.phone || "—"}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-[#7a6555]">#{r.order.orderNumber || r.order.shopifyOrderId}</td>
                      <td className="px-6 py-3.5 text-xs text-[#7a6555]">{new Date(r.order.createdAtShopify).toLocaleDateString("en-IN")}</td>
                      <td className="px-6 py-3.5 text-right text-[#1a130c]">₹{Number(r.commissionBase).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-[#1a2e1e]">₹{Number(r.commissionAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5"><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateStyle[r.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#e5d2ba] bg-[#fdf8f5]">
                    <td colSpan={4} className="px-6 py-3 text-right text-xs font-semibold text-[#7a6555] uppercase tracking-wider">
                      {isFiltered ? "Filtered total" : "Total Earned"}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-[#1a2e1e]">₹{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Monthly statements */}
        {statements.length > 0 && !isFiltered && (
          <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f5ede0]">
              <h2 className="text-sm font-semibold text-[#1a130c]">Monthly Statements</h2>
              <p className="text-xs text-[#7a6555] mt-0.5">Processed by Fresa each month.</p>
            </div>
            <div className="divide-y divide-[#fdf3ea]">
              {statements.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fdf8f5] transition">
                  <span className="text-sm font-medium text-[#1a130c]">{new Date(s.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
                  <span className="text-sm font-bold text-[#1a2e1e]">₹{Number(s.totalCommission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateStyle[s.state] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{s.state}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#e5d2ba] py-6 text-center text-xs text-[#7a6555]">
        <a href="https://www.fresafoods.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#e06b2a] transition">fresafoods.in</a>{" · "}Fresa Partner Portal
      </footer>
    </div>
  );
}
