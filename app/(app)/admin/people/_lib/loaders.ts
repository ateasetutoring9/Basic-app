import { createServerClient } from "@/lib/supabase/server";

export type PeopleListFilters = {
  search?: string;
  state?: string;
  yearId?: number;
};

export type PersonListRow = {
  sync_id: string;
  display_name: string;
  email: string;
  year_display_name: string | null;
  state: string | null;
  updated_at: string;
};

export async function getPeopleList(filters: PeopleListFilters): Promise<PersonListRow[]> {
  const supabase = createServerClient();

  // TODO: add pagination when list exceeds ~500 rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("people")
    .select(
      "sync_id, first_name, last_name, preferred_name, state, updated_at, user:users!people_linked_user_id_fkey(email, deleted_at), year:years!people_year_id_fkey(display_name)"
    )
    .not("linked_user_id", "is", null)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, "\\$&");
    query = query.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,preferred_name.ilike.%${s}%`
    );
  }

  if (filters.state) {
    query = query.eq("state", filters.state);
  }

  if (filters.yearId) {
    query = query.eq("year_id", filters.yearId);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .filter((p) => {
      const u = Array.isArray(p.user) ? p.user[0] : p.user;
      return u && !u.deleted_at;
    })
    .map((p) => {
      const u = Array.isArray(p.user) ? p.user[0] : p.user;
      const yr = Array.isArray(p.year) ? p.year[0] : p.year;

      let display_name: string;
      if (p.preferred_name) {
        display_name = p.preferred_name;
      } else {
        const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
        display_name = full || (u?.email ?? "");
      }

      return {
        sync_id: p.sync_id as string,
        display_name,
        email: (u?.email ?? "") as string,
        year_display_name: (yr?.display_name ?? null) as string | null,
        state: (p.state ?? null) as string | null,
        updated_at: p.updated_at as string,
      };
    });
}

export async function getYearsForFilter(): Promise<Array<{ id: number; display_name: string }>> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("years")
    .select("id, display_name")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("display_order" as never);
  return data ?? [];
}

export const AUSTRALIAN_STATES = ["VIC", "NSW", "QLD", "WA", "SA", "TAS", "NT", "ACT"];
