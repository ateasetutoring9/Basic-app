import { NextResponse } from "next/server";
import { getAllTopics } from "@/lib/content/loader";

export async function GET() {
  const topics = await getAllTopics();
  return NextResponse.json(topics);
}
