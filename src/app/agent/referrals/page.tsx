import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";

type Referral = {
  id: string;
  travellerId: string;
  commissionAmount: number | { toString(): string };
  commissionBase: number | { toString(): string };
  status: string;
  createdAt: Date;
  order: { orderNumber: string | null; shopifyOrderId: string; createdAtShopify: Date };
  traveller: { name: string | null; email: string | null; phone: string | null };
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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default async function AgentReferralsPage() {
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

  const travellers = agent.travellers as Traveller[];
  const referrals = agent.orderReferrals as Referral[];
  const orderedIds = new Set(referrals.map((r) => r.travellerId));
  const totalEarned = referrals.reduce((s, r) => s + Number(r.commissionAmount), 0);
  const statements = agent.statements as Array<{
    id: string; month: Date; totalCommission: number | { toString(): string }; state: string;
  }>;

  // Monthly earnings — last 6 months from order date
  const monthMap = new Map<string, number>();
  for (const r of referrals) {
    const key = monthKey(new Date(r.order.createdAtShopify));
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(r.commissionAmount));
  }
  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return monthKey(d);
  });
  const monthlyData = last6Months.map((key) => ({ key, label: monthLabel(key), amount: monthMap.get(key) ?? 0 }));
  const maxMonthly = Math.max(...monthlyData.map((m) => m.amount), 1);

  // This month earnings
  const thisMonthKey = monthKey(now);
  const thisMonthEarned = monthMap.get(thisMonthKey) ?? 0;

  // Per-referral earnings (who earned the most)
  const perReferral = referrals.map((r) => ({
    name: r.traveller.name || r.traveller.email || r.traveller.phone || "Unknown",
    commission: Number(r.commissionAmount),
    orderValue: Number(r.commissionBase),
    orderNum: r.order.orderNumber || r.order.shopifyOrderId,
  })).sort((a, b) => b.commission - a.commission);
  const maxReferral = Math.max(...perReferral.map((p) => p.commission), 1);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Navbar */}
      <nav className="bg-[#1a2e1e] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="https://www.fresafoods.in/cdn/shop/files/fresa-new-logo.png?v=1740643169&width=300"
            alt="Fresa Foods" width={100} height={34}
            className="brightness-0 invert" unoptimized
          />
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <Link href="/agent/dashboard" className="text-xs text-[#e06b2a] font-semibold hover:underline mb-2 inline-block">← Back to Dashboard</Link>
          <h1 className="text-xl font-bold text-[#1a130c]">My Referrals & Earnings</h1>
          <p className="text-sm text-[#7a6555]">{travellers.length} referrals · {referrals.length} orders · ₹{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })} total earned</p>
        </div>

        {/* ── DASHBOARD ── */}
        {/* Summary KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Earned", value: `₹${totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, sub: "All time", highlight: true },
            { label: "This Month", value: `₹${thisMonthEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, sub: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }) },
            { label: "Orders Matched", value: referrals.length, sub: `of ${travellers.length} referrals` },
            { label: "Avg per Order", value: referrals.length ? `₹${(totalEarned / referrals.length).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0", sub: "Commission per order" },
          ].map((k) => (
            <div key={k.label} className={`rounded-2xl border px-5 py-4 ${k.highlight ? "bg-[#1a2e1e] border-[#2a4a2e] text-white" : "bg-white border-[#e5d2ba]"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${k.highlight ? "text-[#a8c9b0]" : "text-[#7a6555]"}`}>{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.highlight ? "text-white" : "text-[#1a2e1e]"}`}>{k.value}</p>
              <p className={`text-xs mt-0.5 ${k.highlight ? "text-[#a8c9b0]/70" : "text-[#7a6555]/70"}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Monthly earnings bar chart */}
          <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#1a130c] mb-1">Monthly Earnings</h2>
            <p className="text-xs text-[#7a6555] mb-5">Commission earned per month over the last 6 months</p>
            <div className="space-y-3">
              {monthlyData.map((m) => (
                <div key={m.key} className="flex items-center gap-3">
                  <span className="text-xs text-[#7a6555] w-12 shrink-0 font-medium">{m.label}</span>
                  <div className="flex-1 bg-[#f5ede0] rounded-full h-6 overflow-hidden">
                    <div
                      className="h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{
                        width: m.amount > 0 ? `${Math.max((m.amount / maxMonthly) * 100, 4)}%` : "0%",
                        background: m.key === thisMonthKey ? "#e06b2a" : "#1a2e1e",
                      }}
                    >
                      {m.amount > 0 && (
                        <span className="text-xs font-semibold text-white">
                          ₹{m.amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  </div>
                  {m.amount === 0 && <span className="text-xs text-[#7a6555]/50">—</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-5 pt-4 border-t border-[#f5ede0]">
              <div className="flex items-center gap-1.5 text-xs text-[#7a6555]">
                <span className="inline-block w-3 h-3 rounded-full bg-[#e06b2a]" /> This month
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#7a6555]">
                <span className="inline-block w-3 h-3 rounded-full bg-[#1a2e1e]" /> Previous months
              </div>
            </div>
          </div>

          {/* Per-referral earnings */}
          <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#1a130c] mb-1">Earnings by Referral</h2>
            <p className="text-xs text-[#7a6555] mb-5">Commission earned from each person who ordered</p>
            {perReferral.length === 0 ? (
              <p className="text-sm text-[#7a6555] py-8 text-center">No orders matched yet.</p>
            ) : (
              <div className="space-y-3">
                {perReferral.slice(0, 6).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-[#7a6555] w-24 shrink-0 truncate font-medium" title={p.name}>{p.name}</span>
                    <div className="flex-1 bg-[#f5ede0] rounded-full h-6 overflow-hidden">
                      <div
                        className="h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{
                          width: `${Math.max((p.commission / maxReferral) * 100, 4)}%`,
                          background: i === 0 ? "#e06b2a" : "#1a2e1e",
                        }}
                      >
                        <span className="text-xs font-semibold text-white">
                          ₹{p.commission.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {perReferral.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#f5ede0] flex justify-between text-xs text-[#7a6555]">
                <span>{perReferral.length} referral{perReferral.length !== 1 ? "s" : ""} converted</span>
                <span className="font-semibold text-[#e06b2a]">{Math.round((perReferral.length / Math.max(travellers.length, 1)) * 100)}% conversion rate</span>
              </div>
            )}
          </div>
        </div>

        {/* ── REFERRAL LIST ── */}
        <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5ede0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1a130c]">Your Referrals</h2>
              <p className="text-xs text-[#7a6555] mt-0.5">People you've referred and their order status.</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 text-xs font-semibold">{referrals.length} ordered</span>
              <span className="rounded-full bg-[#fdf3ea] border border-[#e5d2ba] text-[#7a6555] px-2.5 py-1 text-xs font-semibold">{travellers.length - referrals.length} pending</span>
            </div>
          </div>
          {travellers.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[#7a6555]">No referrals yet. Contact your Fresa admin to import your client list.</div>
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
                    return (
                      <tr key={t.id} className="hover:bg-[#fdf8f5] transition">
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
            <h2 className="text-sm font-semibold text-[#1a130c]">Commission Transactions</h2>
            <p className="text-xs text-[#7a6555] mt-0.5">5% of each matched order value, credited to your account.</p>
          </div>
          {referrals.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[#7a6555]">No transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f5ede0] bg-[#fdf8f5]">
                    {[["Customer", "left"], ["Order #", "left"], ["Order Value", "right"], ["Your Commission", "right"], ["Status", "left"]].map(([h, a]) => (
                      <th key={h} className={`px-6 py-3 text-${a} text-xs font-semibold uppercase tracking-wider text-[#7a6555]`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fdf3ea]">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fdf8f5] transition">
                      <td className="px-6 py-3.5 font-medium text-[#1a130c]">{r.traveller.name || r.traveller.email || r.traveller.phone || "—"}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-[#7a6555]">#{r.order.orderNumber || r.order.shopifyOrderId}</td>
                      <td className="px-6 py-3.5 text-right text-[#1a130c]">₹{Number(r.commissionBase).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-[#1a2e1e]">₹{Number(r.commissionAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateStyle[r.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#e5d2ba] bg-[#fdf8f5]">
                    <td colSpan={3} className="px-6 py-3 text-right text-xs font-semibold text-[#7a6555] uppercase tracking-wider">Total Earned</td>
                    <td className="px-6 py-3 text-right font-bold text-[#1a2e1e]">₹{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Monthly statements */}
        {statements.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f5ede0]">
              <h2 className="text-sm font-semibold text-[#1a130c]">Monthly Statements</h2>
              <p className="text-xs text-[#7a6555] mt-0.5">Processed by Fresa every month.</p>
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
        <a href="https://www.fresafoods.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#e06b2a] transition">fresafoods.in</a>
        {" · "}Fresa Partner Portal
      </footer>
    </div>
  );
}
