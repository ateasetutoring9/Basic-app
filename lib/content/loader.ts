import { createServerClient } from "@/lib/supabase/server";
import type { Topic, Subject, Year, Lecture, Worksheet, Question } from "./types";

// Selects the full topic tree: subject → year, plus lecture and worksheet.
const TOPIC_SELECT = `
  id,
  sync_id,
  title,
  description,
  thumbnail_url,
  is_published,
  subjects (
    id,
    sync_id,
    name,
    description,
    display_order,
    is_active,
    years (
      id,
      sync_id,
      name,
      display_name,
      is_active
    )
  ),
  lectures (
    format,
    title,
    content,
    deleted_at
  ),
  worksheets (
    id,
    sync_id,
    title,
    questions,
    difficulty,
    deleted_at
  )
` as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapYear(row: any): Year {
  return {
    id: row.id as number,
    syncId: row.sync_id as string,
    name: row.name as string,
    displayName: row.display_name as string,
    isActive: row.is_active as boolean,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubject(row: any): Subject {
  return {
    id: row.id as number,
    syncId: row.sync_id as string,
    name: row.name as string,
    description: row.description as string | null,
    displayOrder: row.display_order as number,
    isActive: row.is_active as boolean,
    year: mapYear(row.years),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Topic {
  const subjectRow = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
  const subject = mapSubject(subjectRow);

  let lecture: Lecture | undefined;
  const lecRow = Array.isArray(row.lectures) ? row.lectures[0] : row.lectures;
  if (lecRow && !lecRow.deleted_at) {
    const c = lecRow.content as Record<string, unknown>;
    if (lecRow.format === "video") {
      lecture = {
        format: "video",
        title: lecRow.title as string,
        content: {
          youtubeId: c.youtube_id as string,
          durationSeconds: c.duration_seconds as number | undefined,
        },
      };
    } else if (lecRow.format === "slides") {
      lecture = {
        format: "slides",
        title: lecRow.title as string,
        content: c.html as string,
      };
    } else {
      lecture = {
        format: "text",
        title: lecRow.title as string,
        content: c.markdown as string,
      };
    }
  }

  let worksheet: Worksheet | undefined;
  const wsRow = Array.isArray(row.worksheets) ? row.worksheets[0] : row.worksheets;
  if (wsRow && !wsRow.deleted_at) {
    worksheet = {
      id: wsRow.id as number,
      syncId: wsRow.sync_id as string,
      title: wsRow.title as string,
      questions: wsRow.questions as Question[],
      difficulty: wsRow.difficulty as number,
    };
  }

  return {
    id: row.id as number,
    syncId: row.sync_id as string,
    title: row.title as string,
    description: row.description as string | null,
    thumbnailUrl: row.thumbnail_url as string | null,
    isPublished: row.is_published as boolean,
    subject,
    lecture,
    worksheet,
  };
}

export async function getAllTopics(): Promise<Topic[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_SELECT)
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("id");

  if (error || !data) return [];
  return data.map(mapRow);
}

export async function getTopicBySyncId(syncId: string): Promise<Topic | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_SELECT)
    .is("deleted_at", null)
    .eq("sync_id", syncId)
    .single();

  if (error || !data) return null;
  return mapRow(data);
}

// Returns all unique subjects (with their year) that have at least one
// published topic — used to build the browse navigation.
export async function getActiveSubjects(): Promise<Subject[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("subjects")
    .select(`
      id, sync_id, name, description, display_order, is_active,
      years ( id, sync_id, name, display_name, is_active )
    `)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("display_order");

  if (error || !data) return [];
  return data.map(mapSubject);
}
