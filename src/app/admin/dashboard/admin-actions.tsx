"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AgentOption = { id: string; code: string; contactName?: string | null };

const inputClass =
  "w-full rounded-lg border border-[#e0ccea] bg-white px-3 py-2.5 text-sm text-[#1a1523] placeholder:text-[#b09bbf] focus:border-[#a378ad] focus:outline-none focus:ring-2 focus:ring-[#a378ad]/20 transition";

const selectClass =
  "w-full rounded-lg border border-[#e0ccea] bg-white px-3 py-2.5 text-sm text-[#1a1523] focus:border-[#a378ad] focus:outline-none focus:ring-2 focus:ring-[#a378ad]/20 transition";

const btnPrimary =
  "w-full rounded-lg bg-[#a378ad] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8f649a] transition disabled:opacity-60";

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-[#e0ccea] shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[#1a1523] mb-0.5">{title}</h3>
      {description && <p className="text-xs text-[#6b5f7a] mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

function AgentSelect({ name, agents }: { name: string; agents: AgentOption[] }) {
  return (
    <select name={name} required className={selectClass}>
      <option value="">Select agent…</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {a.code}{a.contactName ? ` — ${a.contactName}` : ""}
        </option>
      ))}
    </select>
  );
}

export function AdminActions({ agents }: { agents: AgentOption[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);

  function showStatus(msg: string, ok: boolean) {
    setStatus({ msg, ok });
  }

  async function createAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    showStatus("Creating agent…", true);
    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        code: form.get("code"),
        companyName: form.get("companyName") || undefined,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { showStatus(data?.error || "Could not create agent.", false); return; }
    showStatus("Agent created successfully.", true);
    formElement.reset();
    router.refresh();
  }

  async function importTravellers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    showStatus("Importing travellers…", true);
    const res = await fetch("/api/admin/import-travellers", { method: "POST", body: new FormData(formElement) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { showStatus(data?.error || "Import failed.", false); return; }
    showStatus(`Import complete — ${data.insertedRows} added, ${data.conflictedRows} skipped.`, true);
    formElement.reset();
    router.refresh();
  }

  async function addTraveller(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    showStatus("Adding traveller…", true);
    const res = await fetch("/api/admin/travellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: form.get("agentId"),
        name: form.get("name") || undefined,
        email: form.get("email") || undefined,
        phone: form.get("phone") || undefined,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { showStatus(data?.error || "Could not add traveller.", false); return; }
    showStatus("Traveller added.", true);
    formElement.reset();
    router.refresh();
  }

  async function addOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    showStatus("Recording order…", true);
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerEmail: form.get("customerEmail") || undefined,
        customerPhone: form.get("customerPhone") || undefined,
        orderNumber: form.get("orderNumber") || undefined,
        subtotalAmount: form.get("subtotalAmount"),
        currency: "INR",
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { showStatus(data?.error || "Could not record order.", false); return; }
    showStatus(`Order recorded. Commission ₹${Number(data.commissionAmount).toFixed(2)} attributed.`, true);
    formElement.reset();
    router.refresh();
  }

  async function generateStatements() {
    showStatus("Generating statements…", true);
    const res = await fetch("/api/admin/statements/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: new Date().toISOString() }),
    });
    if (!res.ok) { showStatus("Statement generation failed.", false); return; }
    showStatus("Monthly statements generated.", true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Create agent + CSV import + Commission */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Create Agent" description="Add a new travel agent partner account.">
          <form onSubmit={createAgent} className="space-y-2.5">
            <input name="name" required placeholder="Full name" className={inputClass} />
            <input name="email" required type="email" placeholder="Email address" className={inputClass} />
            <input name="password" required type="password" placeholder="Temporary password (min 8 chars)" className={inputClass} />
            <input name="code" required placeholder="Agent code  e.g. TRAVEL01" className={inputClass} />
            <input name="companyName" placeholder="Company name (optional)" className={inputClass} />
            <button type="submit" className={btnPrimary}>Create Agent</button>
          </form>
        </SectionCard>

        <SectionCard title="Import Travellers via CSV" description="Upload a .csv or .xlsx file and link it to an agent.">
          <form onSubmit={importTravellers} className="space-y-2.5">
            <AgentSelect name="agentId" agents={agents} />
            <input
              name="file" required type="file" accept=".csv,.xlsx,.xls"
              className="w-full rounded-lg border border-[#e0ccea] bg-white px-3 py-2 text-sm text-[#1a1523] file:mr-3 file:rounded-md file:border-0 file:bg-[#f3eaf8] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#442037] transition"
            />
            <p className="text-xs text-[#6b5f7a]">Columns: <code className="bg-[#f3eaf8] px-1 rounded text-[#442037]">name</code>, <code className="bg-[#f3eaf8] px-1 rounded text-[#442037]">email</code>, <code className="bg-[#f3eaf8] px-1 rounded text-[#442037]">phone</code></p>
            <button type="submit" className={btnPrimary}>Upload &amp; Import</button>
          </form>
        </SectionCard>

        <SectionCard title="Commission Actions" description="Generate monthly statements for all agents based on matched orders.">
          <div className="space-y-3">
            <div className="rounded-xl bg-[#f8f3fb] border border-[#e0ccea] p-4 text-sm text-[#6b5f7a]">
              Creates or updates a <strong className="text-[#1a1523]">Draft</strong> statement for every agent with unprocessed referrals this month.
            </div>
            <button onClick={generateStatements} className={btnPrimary}>
              Generate Monthly Statements
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Row 2: Manual traveller + Manual order */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Add Traveller Manually" description="Add a single referral and link them to an agent.">
          <form onSubmit={addTraveller} className="space-y-2.5">
            <AgentSelect name="agentId" agents={agents} />
            <input name="name" placeholder="Full name (optional)" className={inputClass} />
            <div className="grid grid-cols-2 gap-2">
              <input name="email" type="email" placeholder="Email" className={inputClass} />
              <input name="phone" type="tel" placeholder="Phone" className={inputClass} />
            </div>
            <p className="text-xs text-[#6b5f7a]">At least one of email or phone is required.</p>
            <button type="submit" className={btnPrimary}>Add Traveller</button>
          </form>
        </SectionCard>

        <SectionCard title="Record Order Manually" description="Add an order and auto-attribute commission to the matching agent.">
          <form onSubmit={addOrder} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input name="customerEmail" type="email" placeholder="Customer email" className={inputClass} />
              <input name="customerPhone" type="tel" placeholder="Customer phone" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="orderNumber" placeholder="Order # (optional)" className={inputClass} />
              <input name="subtotalAmount" type="number" min="1" step="0.01" required placeholder="Order value (₹)" className={inputClass} />
            </div>
            <p className="text-xs text-[#6b5f7a]">The customer must already exist in a traveller list. Commission is 5% of order value.</p>
            <button type="submit" className={btnPrimary}>Record Order</button>
          </form>
        </SectionCard>
      </div>

      {/* Status bar */}
      {status && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${status.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {status.msg}
        </div>
      )}
    </div>
  );
}
