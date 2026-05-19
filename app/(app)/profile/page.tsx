"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/ui/PageContainer";

export const runtime = "edge";

const AUSTRALIAN_STATES = ["VIC", "NSW", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

const SELECT_CLASS =
  "w-full rounded-md border border-border-strong px-3.5 py-2.5 text-base text-fg bg-card min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors duration-150";

interface Year {
  sync_id: string;
  display_name: string;
}

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  school_name: string | null;
  state: string | null;
  year_sync_id: string | null;
  photo_url: string | null;
}

const BLANK: ProfileData = {
  first_name: null,
  last_name: null,
  preferred_name: null,
  date_of_birth: null,
  phone_number: null,
  school_name: null,
  state: null,
  year_sync_id: null,
  photo_url: null,
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(BLANK);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function load() {
      const [profileRes, yearsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/admin/years"),
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile({
          first_name: data.first_name ?? null,
          last_name: data.last_name ?? null,
          preferred_name: data.preferred_name ?? null,
          date_of_birth: data.date_of_birth ?? null,
          phone_number: data.phone_number ?? null,
          school_name: data.school_name ?? null,
          state: data.state ?? null,
          year_sync_id: data.year_sync_id ?? null,
          photo_url: data.photo_url ?? null,
        });
      }
      if (yearsRes.ok) {
        const data = await yearsRes.json();
        setYears(data.map((y: { sync_id: string; display_name: string }) => ({
          sync_id: y.sync_id,
          display_name: y.display_name,
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  function set(field: keyof ProfileData, value: string) {
    setProfile((p) => ({ ...p, [field]: value || null }));
    if (field === "phone_number") setPhoneError(validatePhone(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pe = validatePhone(profile.phone_number ?? "");
    if (pe) { setPhoneError(pe); return; }
    setSaving(true);
    setError("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        preferred_name: profile.preferred_name || null,
        date_of_birth: profile.date_of_birth || null,
        phone_number: profile.phone_number || null,
        school_name: profile.school_name || null,
        state: profile.state || null,
        year_sync_id: profile.year_sync_id || null,
        photo_url: profile.photo_url || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      setSaving(false);
    } else {
      router.back();
    }
  }

  return (
    <PageContainer as="main">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted hover:text-fg transition-colors mb-2 inline-block"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-fg">My Profile</h1>
        <p className="text-muted mt-1">Update your personal information.</p>
      </div>

      {loading ? (
        <p className="text-muted animate-pulse">Loading…</p>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-border bg-white shadow-sm max-w-lg">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                placeholder="Alex"
                value={profile.first_name ?? ""}
                onChange={(e) => set("first_name", e.target.value)}
              />
              <Input
                label="Last name"
                placeholder="Johnson"
                value={profile.last_name ?? ""}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </div>

            <Input
              label="Preferred name"
              placeholder="e.g. AJ"
              value={profile.preferred_name ?? ""}
              onChange={(e) => set("preferred_name", e.target.value)}
              helper="Shown instead of your first name if set"
            />

            <Input
              label="Date of birth"
              type="date"
              value={profile.date_of_birth ?? ""}
              onChange={(e) => set("date_of_birth", e.target.value)}
            />

            <Input
              label="Phone number"
              type="tel"
              placeholder="0400 000 000"
              value={profile.phone_number ?? ""}
              onChange={(e) => set("phone_number", e.target.value)}
              error={phoneError || undefined}
            />

            <Input
              label="School name"
              placeholder="e.g. Melbourne High School"
              value={profile.school_name ?? ""}
              onChange={(e) => set("school_name", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-small font-medium text-fg">State</label>
                <select
                  value={profile.state ?? ""}
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
                  value={profile.year_sync_id ?? ""}
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
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </PageContainer>
  );
}
