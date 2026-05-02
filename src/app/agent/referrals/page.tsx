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
  order: { orderNumber: string | null; shopifyOrderId: string };
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
            <Link href="/agent/dashboard" className="text-xs font-medium text-white/60 hover:text-white transition">Home</Link>
            <Link href="/agent/referrals" className="text-xs font-semibold text-white/90 hover:text-white transition">My Referrals</Link>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-white/50">{agent.code}</span>
          <LogoutButton />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/agent/dashboard" className="text-xs text-[#e06b2a] font-semibold hover:underline mb-2 inline-block">← Back to Dashboard</Link>
            <h1 className="text-xl font-bold text-[#1a130c]">My Referrals</h1>
            <p className="text-sm text-[#7a6555]">{travellers.length} people in your list · {referrals.length} orders matched · ₹{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })} earned</p>
          </div>
        </div>

        {/* Referral list */}
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
            <div className="px-6 py-12 text-center text-sm text-[#7a6555]">
              No referrals yet. Contact your Fresa admin to import your client list.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f5ede0] bg-[#fdf8f5]">
                    {["Name", "Email", "Phone", "Added on", "Order Status"].map((h) => (
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
                          {ordered ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">✓ Ordered</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[#fdf3ea] border border-[#e5d2ba] px-2.5 py-0.5 text-xs font-semibold text-[#7a6555]">Pending</span>
                          )}
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
            <div className="px-6 py-12 text-center text-sm text-[#7a6555]">
              No commission transactions yet. Commissions appear once a referred customer places an order.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f5ede0] bg-[#fdf8f5]">
                    {["Customer", "Order #", "Order Value", "Your Commission", "Status"].map((h) => (
                      <th key={h} className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#7a6555] ${h === "Order Value" || h === "Your Commission" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fdf3ea]">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fdf8f5] transition">
                      <td className="px-6 py-3.5 font-medium text-[#1a130c]">
                        {r.traveller.name || r.traveller.email || r.traveller.phone || "—"}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-[#7a6555]">#{r.order.orderNumber || r.order.shopifyOrderId}</td>
                      <td className="px-6 py-3.5 text-right text-[#1a130c]">₹{Number(r.commissionBase).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-[#1a2e1e]">₹{Number(r.commissionAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateStyle[r.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#e5d2ba] bg-[#fdf8f5]">
                    <td colSpan={3} className="px-6 py-3 text-right text-xs font-semibold text-[#7a6555] uppercase tracking-wider">Total earned</td>
                    <td className="px-6 py-3 text-right font-bold text-[#1a2e1e]">₹{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* All statements */}
        {statements.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f5ede0]">
              <h2 className="text-sm font-semibold text-[#1a130c]">Monthly Statements</h2>
              <p className="text-xs text-[#7a6555] mt-0.5">Processed by Fresa every month. Reach out to your admin for payout details.</p>
            </div>
            <div className="divide-y divide-[#fdf3ea]">
              {statements.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fdf8f5] transition">
                  <span className="text-sm font-medium text-[#1a130c]">
                    {new Date(s.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                  <span className="text-sm font-bold text-[#1a2e1e]">₹{Number(s.totalCommission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateStyle[s.state] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {s.state}
                  </span>
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
