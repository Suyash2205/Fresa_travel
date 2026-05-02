"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AgentOption = {
  id: string;
  code: string;
};

export function AdminActions({ agents }: { agents: AgentOption[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");

  async function createAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Creating agent...");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        code: form.get("code"),
        companyName: form.get("companyName"),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setStatus(data?.error || "Could not create agent. Check values and try again.");
      return;
    }

    setStatus("Agent created.");
    formElement.reset();
    router.refresh();
  }

  async function importTravellers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Importing travellers...");
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const response = await fetch("/api/admin/import-travellers", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setStatus(data?.error || "Import failed. Please verify agent and file format.");
      return;
    }

    const result = await response.json();
    setStatus(`Import complete. Inserted: ${result.insertedRows}, conflicts: ${result.conflictedRows}.`);
    formElement.reset();
    router.refresh();
  }

  async function addTraveller(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Adding traveller...");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/travellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: form.get("agentId"),
        name: form.get("name") || undefined,
        email: form.get("email") || undefined,
        phone: form.get("phone") || undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setStatus(data?.error || "Could not add traveller.");
      return;
    }

    setStatus("Traveller added.");
    formElement.reset();
    router.refresh();
  }

  async function addOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Recording order...");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/orders", {
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

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(data?.error || "Could not record order.");
      return;
    }

    setStatus(`Order recorded. Commission: Rs. ${Number(data.commissionAmount).toFixed(2)} attributed to agent.`);
    formElement.reset();
    router.refresh();
  }

  async function generateStatements() {
    setStatus("Generating monthly statements...");
    const response = await fetch("/api/admin/statements/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: new Date().toISOString() }),
    });
    if (!response.ok) {
      setStatus("Statement generation failed.");
      return;
    }
    setStatus("Monthly statements generated.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={createAgent} className="rounded-xl border border-[#ffd8c8] bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-[#1d1d1d]">Create Agent</h3>
          <div className="space-y-2">
            <input name="name" required placeholder="Agent name" className="w-full rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
            <input name="email" required type="email" placeholder="Agent email" className="w-full rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
            <input name="password" required type="password" placeholder="Temporary password" className="w-full rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
            <input name="code" required placeholder="Agent code (e.g. TRAVEL01)" className="w-full rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
            <input name="companyName" placeholder="Company name (optional)" className="w-full rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
            <button type="submit" className="w-full rounded-md bg-[#fd8756] px-3 py-2 text-sm font-medium text-white hover:bg-[#e97647]">
              Create Agent
            </button>
          </div>
        </form>

        <form onSubmit={importTravellers} className="rounded-xl border border-[#ffd8c8] bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-[#1d1d1d]">Import Travellers via CSV</h3>
          <div className="space-y-2">
            <select name="agentId" required className="w-full rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] focus:border-[#fd8756] focus:outline-none">
              <option value="">Select agent</option>
              {agents.map((agent: AgentOption) => (
                <option key={agent.id} value={agent.id}>
                  {agent.code}
                </option>
              ))}
            </select>
            <input name="file" required type="file" accept=".csv,.xlsx,.xls" className="w-full rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] file:mr-3 file:rounded-md file:border-0 file:bg-[#fee2d5] file:px-3 file:py-1.5 file:text-[#7a3d25]" />
            <button type="submit" className="w-full rounded-md bg-[#fd8756] px-3 py-2 text-sm font-medium text-white hover:bg-[#e97647]">
              Upload and Import
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-[#ffd8c8] bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-[#1d1d1d]">Commission Actions</h3>
          <p className="mb-3 text-sm text-[#3f3f3f]">Generate this month statements based on matched orders.</p>
          <button onClick={generateStatements} className="w-full rounded-md bg-[#fd8756] px-3 py-2 text-sm font-medium text-white hover:bg-[#e97647]">
            Generate Monthly Statements
          </button>
        </div>
      </section>

      <form onSubmit={addTraveller} className="rounded-xl border border-[#ffd8c8] bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-[#1d1d1d]">Add Traveller Manually</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select name="agentId" required className="rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] focus:border-[#fd8756] focus:outline-none">
            <option value="">Select agent</option>
            {agents.map((agent: AgentOption) => (
              <option key={agent.id} value={agent.id}>
                {agent.code}
              </option>
            ))}
          </select>
          <input name="name" placeholder="Full name (optional)" className="rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
          <input name="email" type="email" placeholder="Email" className="rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
          <input name="phone" type="tel" placeholder="Phone" className="rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
          <button type="submit" className="rounded-md bg-[#fd8756] px-3 py-2 text-sm font-medium text-white hover:bg-[#e97647]">
            Add Traveller
          </button>
        </div>
        <p className="mt-2 text-xs text-[#8a8a8a]">At least one of email or phone is required.</p>
      </form>

      <form onSubmit={addOrder} className="rounded-xl border border-[#ffd8c8] bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-[#1d1d1d]">Add Order Manually</h3>
        <p className="mb-3 text-xs text-[#8a8a8a]">Automatically links to the agent whose referral matches the email or phone.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input name="customerEmail" type="email" placeholder="Customer email" className="rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
          <input name="customerPhone" type="tel" placeholder="Customer phone" className="rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
          <input name="orderNumber" placeholder="Order # (optional)" className="rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
          <input name="subtotalAmount" type="number" min="1" step="0.01" required placeholder="Order value (Rs.)" className="rounded-md border border-[#f0c7b5] bg-white px-3 py-2 text-sm text-[#1d1d1d] placeholder:text-[#8a8a8a] focus:border-[#fd8756] focus:outline-none" />
          <button type="submit" className="rounded-md bg-[#fd8756] px-3 py-2 text-sm font-medium text-white hover:bg-[#e97647]">
            Record Order
          </button>
        </div>
        <p className="mt-2 text-xs text-[#8a8a8a]">At least one of email or phone is required. The traveller must already exist in the system.</p>
      </form>

      {status ? (
        <div className="rounded-md border border-[#ffd8c8] bg-[#fff5f1] px-3 py-2 text-sm text-[#7a3d25]">
          {status}
        </div>
      ) : null}
    </div>
  );
}
