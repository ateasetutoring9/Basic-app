import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { WorksheetFileSchema } from "@/lib/content/schemas";

const CONTENT_DIR = path.join(process.cwd(), "content");

function worksheetPath(subject: string, year: string, slug: string) {
  return path.join(CONTENT_DIR, subject, `year-${year}`, slug, "worksheet.json");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  const year = searchParams.get("year");
  const slug = searchParams.get("slug");
  if (!subject || !year || !slug) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  try {
    const raw = await fs.readFile(worksheetPath(subject, year, slug), "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { subject, year, slug, ...data } = body;
  if (!subject || !year || !slug) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  const parsed = WorksheetFileSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const filePath = worksheetPath(subject, year, slug);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(parsed.data, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  const year = searchParams.get("year");
  const slug = searchParams.get("slug");
  if (!subject || !year || !slug) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  try {
    await fs.unlink(worksheetPath(subject, year, slug));
  } catch {
    // file didn't exist — that's fine
  }
  return NextResponse.json({ ok: true });
}
