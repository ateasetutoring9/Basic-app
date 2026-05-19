"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { AUSTRALIAN_STATES } from "../_lib/loaders";

interface Props {
  years: Array<{ id: number; display_name: string }>;
}

const SELECT_CLASS =
  "rounded-md border border-border-strong px-3 py-2 text-sm text-fg bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors duration-150";

export function PeopleFilters({ years }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const state = searchParams.get("state") ?? "";
  const yearId = searchParams.get("year-id") ?? "";

  const hasFilters = !!(search || state || yearId);

  // Keep search input in sync if URL changes externally (e.g. browser back)
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  function buildParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(buildParams({ search: value }));
    }, 300);
  }

  function handleStateChange(value: string) {
    router.replace(buildParams({ state: value }));
  }

  function handleYearChange(value: string) {
    router.replace(buildParams({ "year-id": value }));
  }

  function clearFilters() {
    setSearch("");
    router.replace(pathname);
  }

  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      <input
        type="search"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className={`${SELECT_CLASS} min-w-[200px]`}
      />

      <select
        value={state}
        onChange={(e) => handleStateChange(e.target.value)}
        className={SELECT_CLASS}
        aria-label="Filter by state"
      >
        <option value="">All states</option>
        {AUSTRALIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={yearId}
        onChange={(e) => handleYearChange(e.target.value)}
        className={SELECT_CLASS}
        aria-label="Filter by year"
      >
        <option value="">All years</option>
        {years.map((y) => (
          <option key={y.id} value={String(y.id)}>
            {y.display_name}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-muted hover:text-fg transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
