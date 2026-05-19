"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const AUSTRALIAN_STATES = ["VIC", "NSW", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

const SELECT_CLASS =
  "w-full rounded-md border border-border-strong px-3.5 py-2.5 text-base text-fg bg-card min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors duration-150";

interface Year {
  sync_id: string;
  display_name: string;
}

export interface PersonFormData {
  import_email: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  school_name: string | null;
  state: string | null;
  year_sync_id: string | null;
  photo_url: string | null;
  linked_user_email?: string | null;
}

interface Props {
  mode: "create" | "edit";
  syncId?: string;
  initialData?: PersonFormData;
  years: Year[];
}

export function PersonForm({ mode, syncId, initialData, years }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    import_email: initialData?.import_email ?? "",
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    preferred_name: initialData?.preferred_name ?? "",
    date_of_birth: initialData?.date_of_birth ?? "",
    phone_number: initialData?.phone_number ?? "",
    school_name: initialData?.school_name ?? "",
    state: initialData?.state ?? "",
    year_sync_id: initialData?.year_sync_id ?? "",
    photo_url: initialData?.photo_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const PHONE_RE = /^[+\d][\d\s\-()+]*$/;

  function validatePhone(value: string): string {
    if (!value) return "";
    if (!PHONE_RE.test(value)) return "Only digits, spaces, +, -, and ( ) are allowed";
    if (value.replace(/\D/g, "").length < 7) return "Phone number is too short";
    return "";
  }

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "phone_number") setPhoneError(validatePhone(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pe = validatePhone(form.phone_number);
    if (pe) { setPhoneError(pe); return; }
    setSaving(true);
    setError("");

    const body = {
      import_email: form.import_email || null,
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      preferred_name: form.preferred_name || null,
      date_of_birth: form.date_of_birth || null,
      phone_number: form.phone_number || null,
      school_name: form.school_name || null,
      state: form.state || null,
      year_sync_id: form.year_sync_id || null,
      photo_url: form.photo_url || null,
    };

    const res = await fetch(
      mode === "edit" ? `/api/admin/people/${syncId}` : "/api/admin/people",
      {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin/people");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-border bg-white shadow-sm max-w-lg">
      <div className="flex flex-col gap-4">

        {/* Linked user — read-only when present */}
        {mode === "edit" && initialData?.linked_user_email !== undefined && (
          <div className="flex flex-col gap-1.5">
            <p className="text-small font-medium text-fg">Linked account</p>
            {initialData.linked_user_email ? (
              <p className="text-sm text-muted bg-gray-50 border border-border rounded-md px-3.5 py-2.5">
                {initialData.linked_user_email}
              </p>
            ) : (
              <p className="text-sm text-muted">Not yet linked to a user account</p>
            )}
          </div>
        )}

        <Input
          label="Import email"
          type="email"
          placeholder="student@example.com"
          value={form.import_email}
          onChange={(e) => set("import_email", e.target.value)}
          helper={
            mode === "create"
              ? "Used to auto-link this record when the person signs up"
              : undefined
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            placeholder="Alex"
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
          />
          <Input
            label="Last name"
            placeholder="Johnson"
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
          />
        </div>

        <Input
          label="Preferred name"
          placeholder="e.g. AJ"
          value={form.preferred_name}
          onChange={(e) => set("preferred_name", e.target.value)}
          helper="Shown instead of first name if set"
        />

        <Input
          label="Date of birth"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => set("date_of_birth", e.target.value)}
        />

        <Input
          label="Phone number"
          type="tel"
          placeholder="0400 000 000"
          value={form.phone_number}
          onChange={(e) => set("phone_number", e.target.value)}
          error={phoneError || undefined}
        />

        <Input
          label="School name"
          placeholder="e.g. Melbourne High School"
          value={form.school_name}
          onChange={(e) => set("school_name", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-small font-medium text-fg">State</label>
            <select
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">— Select —</option>
              {AUSTRALIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-small font-medium text-fg">Year level</label>
            <select
              value={form.year_sync_id}
              onChange={(e) => set("year_sync_id", e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">— Select —</option>
              {years.map((y) => (
                <option key={y.sync_id} value={y.sync_id}>{y.display_name}</option>
              ))}
            </select>
          </div>
        </div>


      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 mt-6">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/people")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
