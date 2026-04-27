import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const supabase = createServerClient();

  // 1. Attempts for this user
  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, worksheet_id, score, total, created_at")
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!attempts?.length) return NextResponse.json([]);

  const worksheetIds = Array.from(new Set(attempts.map((a) => a.worksheet_id)));

  // 2. Worksheets by integer id — avoids broken FK join
  const { data: worksheets } = await supabase
    .from("worksheets")
    .select("id, title, topic_id")
    .in("id", worksheetIds)
    .is("deleted_at", null);

  const wsMap = new Map((worksheets ?? []).map((w) => [w.id, w]));
  const topicIds = Array.from(new Set((worksheets ?? []).map((w) => w.topic_id).filter(Boolean)));

  // 3. Topics by integer id
  const { data: topics } = await supabase
    .from("topics")
    .select("id, sync_id, title, subject_id")
    .in("id", topicIds)
    .is("deleted_at", null);

  const topicMap = new Map((topics ?? []).map((t) => [t.id, t]));
  const subjectIds = Array.from(new Set((topics ?? []).map((t) => t.subject_id).filter(Boolean)));

  // 4. Subjects
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, year_id")
    .in("id", subjectIds)
    .is("deleted_at", null);

  const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s]));
  const yearIds = Array.from(new Set((subjects ?? []).map((s) => s.year_id).filter(Boolean)));

  // 5. Years
  const { data: years } = await supabase
    .from("years")
    .select("id, display_name")
    .in("id", yearIds)
    .is("deleted_at", null);

  const yearMap = new Map((years ?? []).map((y) => [y.id, y]));

  // Join everything into the shape ProgressClient expects
  const result = attempts.map((a) => {
    const ws = wsMap.get(a.worksheet_id);
    const topic = ws ? topicMap.get(ws.topic_id) : null;
    const subject = topic ? subjectMap.get(topic.subject_id) : null;
    const year = subject ? yearMap.get(subject.year_id) : null;

    return {
      id: a.id,
      score: a.score,
      total: a.total,
      created_at: a.created_at,
      worksheets: ws
        ? {
            id: ws.id,
            title: ws.title,
            topics: topic
              ? {
                  sync_id: topic.sync_id,
                  title: topic.title,
                  subjects: subject
                    ? {
                        name: subject.name,
                        years: year ? { display_name: year.display_name } : null,
                      }
                    : null,
                }
              : null,
          }
        : null,
    };
  });

  return NextResponse.json(result);
}
