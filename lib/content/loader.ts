import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import {
  MetaSchema,
  LectureFrontmatterSchema,
  WorksheetFileSchema,
} from "./schemas";
import type {
  Subject,
  YearLevel,
  Topic,
  Lecture,
  Worksheet,
  Question,
} from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseYearDir(dirName: string): YearLevel | null {
  const match = /^year-(\d+)$/.exec(dirName);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return ([7, 8, 9, 10, 11, 12] as YearLevel[]).includes(n as YearLevel)
    ? (n as YearLevel)
    : null;
}

function topicId(subject: Subject, year: YearLevel, slug: string) {
  return `${subject}-year${year}-${slug}`;
}

function formatZodError(
  label: string,
  issues: { path: PropertyKey[]; message: string }[]
): string {
  const details = issues
    .map((issue) => {
      const parts = issue.path.filter(
        (p): p is string | number =>
          typeof p === "string" || typeof p === "number"
      );
      const loc = parts.length
        ? parts
            .map((p, i) =>
              typeof p === "number"
                ? i > 0 && parts[i - 1] === "questions"
                  ? `question ${p + 1}`
                  : `[${p}]`
                : p
            )
            .join(" › ")
        : "root";
      return `${loc}: ${issue.message}`;
    })
    .join("; ");
  return `${label}: ${details}`;
}

// ─── Per-topic loader ─────────────────────────────────────────────────────────

async function loadTopic(
  subject: Subject,
  year: YearLevel,
  slug: string
): Promise<Topic> {
  const dir = path.join(CONTENT_DIR, subject, `year-${year}`, slug);
  const ref = `${subject}/year-${year}/${slug}`;

  // meta.json — required
  const metaPath = path.join(dir, "meta.json");
  let metaRaw: unknown;
  try {
    metaRaw = JSON.parse(await fs.readFile(metaPath, "utf-8"));
  } catch {
    throw new Error(`meta.json for ${ref}: file missing or not valid JSON`);
  }
  const metaParsed = MetaSchema.safeParse(metaRaw);
  if (!metaParsed.success) {
    throw new Error(formatZodError(`meta.json for ${ref}`, metaParsed.error.issues));
  }
  const meta = metaParsed.data;

  // lecture.md — optional
  let lecture: Lecture | undefined;
  const lectureMdPath = path.join(dir, "lecture.md");
  try {
    const raw = await fs.readFile(lectureMdPath, "utf-8");
    const { data: fm, content: body } = matter(raw);

    const fmParsed = LectureFrontmatterSchema.safeParse(fm);
    if (!fmParsed.success) {
      throw new Error(
        formatZodError(`lecture.md frontmatter for ${ref}`, fmParsed.error.issues)
      );
    }

    const base = {
      id: topicId(subject, year, slug),
      subject,
      year,
      topicSlug: slug,
      title: meta.title,
      description: meta.description,
      orderIndex: meta.orderIndex,
    };

    const frontmatter = fmParsed.data;
    if (frontmatter.format === "video") {
      lecture = {
        ...base,
        format: "video",
        content: {
          youtubeId: frontmatter.youtubeId,
          durationSeconds: frontmatter.durationSeconds,
        },
      };
    } else if (frontmatter.format === "slides") {
      // slides content comes from slides.html; body of .md is ignored
      const slidesPath = path.join(dir, "slides.html");
      const slidesHtml = await fs.readFile(slidesPath, "utf-8").catch(() => {
        throw new Error(
          `slides.html for ${ref}: format is 'slides' but slides.html is missing`
        );
      });
      lecture = { ...base, format: "slides", content: slidesHtml };
    } else {
      lecture = { ...base, format: "text", content: body.trim() };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    // lecture.md absent — topic has no lecture yet
  }

  // worksheet.json — optional
  let worksheet: Worksheet | undefined;
  const worksheetPath = path.join(dir, "worksheet.json");
  try {
    const raw = await fs.readFile(worksheetPath, "utf-8");
    let worksheetRaw: unknown;
    try {
      worksheetRaw = JSON.parse(raw);
    } catch {
      throw new Error(`worksheet.json for ${ref}: not valid JSON`);
    }

    const parsed = WorksheetFileSchema.safeParse(worksheetRaw);
    if (!parsed.success) {
      throw new Error(
        formatZodError(`worksheet.json for ${ref}`, parsed.error.issues)
      );
    }

    worksheet = {
      id: topicId(subject, year, slug),
      subject,
      year,
      topicSlug: slug,
      title: parsed.data.title,
      questions: parsed.data.questions as Question[],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  return {
    subject,
    year,
    slug,
    title: meta.title,
    description: meta.description,
    orderIndex: meta.orderIndex,
    lecture,
    worksheet,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllTopics(): Promise<Topic[]> {
  let subjectDirs: string[];
  try {
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    subjectDirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name);
  } catch {
    return []; // content dir doesn't exist yet
  }

  const topics: Topic[] = [];

  for (const subject of subjectDirs) {
    const subjectPath = path.join(CONTENT_DIR, subject);
    const yearEntries = await fs.readdir(subjectPath, { withFileTypes: true });

    for (const yearEntry of yearEntries) {
      if (!yearEntry.isDirectory()) continue;
      const year = parseYearDir(yearEntry.name);
      if (!year) continue;

      const yearPath = path.join(subjectPath, yearEntry.name);
      const slugEntries = await fs.readdir(yearPath, { withFileTypes: true });

      for (const slugEntry of slugEntries) {
        if (!slugEntry.isDirectory()) continue;
        topics.push(await loadTopic(subject as Subject, year, slugEntry.name));
      }
    }
  }

  return topics.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getTopic(
  subject: Subject,
  year: YearLevel,
  slug: string
): Promise<Topic | null> {
  try {
    return await loadTopic(subject, year, slug);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function getSubjects(): Promise<
  { subject: Subject; yearCounts: Partial<Record<YearLevel, number>> }[]
> {
  const topics = await getAllTopics();
  const map = new Map<Subject, Partial<Record<YearLevel, number>>>();

  for (const topic of topics) {
    if (!map.has(topic.subject)) map.set(topic.subject, {});
    const yc = map.get(topic.subject)!;
    yc[topic.year] = (yc[topic.year] ?? 0) + 1;
  }

  return Array.from(map.entries()).map(([subject, yearCounts]) => ({
    subject,
    yearCounts,
  }));
}
