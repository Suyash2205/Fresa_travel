"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  monthOptions: { key: string; label: string }[];
  customerOptions: { id: string; name: string }[];
  currentMonth: string;
  currentCustomer: string;
};

export function FilterBar({ monthOptions, customerOptions, currentMonth, currentCustomer }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(params.toString());
      if (value) p.set(key, value);
      else p.delete(key);
      router.push(`?${p.toString()}`);
    },
    [params, router],
  );

  const hasFilter = currentMonth || currentCustomer;

  return (
    <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#7a6555] shrink-0">Filter by</span>

        {/* Month selector */}
        <select
          value={currentMonth}
          onChange={(e) => update("month", e.target.value)}
          className="rounded-lg border border-[#e5d2ba] bg-[#faf8f5] px-3 py-2 text-sm text-[#1a130c] focus:border-[#e06b2a] focus:outline-none focus:ring-2 focus:ring-[#e06b2a]/20 transition"
        >
          <option value="">All months</option>
          {monthOptions.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>

        {/* Customer selector */}
        <select
          value={currentCustomer}
          onChange={(e) => update("customer", e.target.value)}
          className="rounded-lg border border-[#e5d2ba] bg-[#faf8f5] px-3 py-2 text-sm text-[#1a130c] focus:border-[#e06b2a] focus:outline-none focus:ring-2 focus:ring-[#e06b2a]/20 transition"
        >
          <option value="">All customers</option>
          {customerOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {hasFilter && (
          <button
            onClick={() => router.push("?")}
            className="rounded-lg border border-[#e5d2ba] px-3 py-2 text-xs font-semibold text-[#7a6555] hover:bg-[#fdf3ea] hover:text-[#e06b2a] transition"
          >
            ✕ Clear filters
          </button>
        )}

        {hasFilter && (
          <span className="ml-auto text-xs text-[#e06b2a] font-semibold">
            {[currentMonth && `Month: ${monthOptions.find(m => m.key === currentMonth)?.label}`, currentCustomer && `Customer: ${customerOptions.find(c => c.id === currentCustomer)?.name}`].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
    </div>
  );
}
