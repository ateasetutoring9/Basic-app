import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { worksheetId, score, total, answers } = await req.json();

  if (worksheetId === undefined || score === undefined || total === undefined || !answers) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();

  // worksheets_history is not in generated types — cast table name to bypass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: historyRaw } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("worksheets_history" as any)
    .select("id")
    .eq("worksheet_id", worksheetId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  const worksheetHistoryId = (historyRaw as { id: number } | null)?.id ?? null;

  // worksheet_history_id was added via ALTER TABLE after types were generated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    user_id: session.userId,
    worksheet_id: worksheetId,
    score,
    total,
    answers,
    worksheet_history_id: worksheetHistoryId,
  };

  const { error } = await supabase.from("attempts").insert(payload);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
