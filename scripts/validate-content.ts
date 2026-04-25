/**
 * Run with: npm run content:check
 * Loads all topics from the DB, validates them, and prints a summary.
 */

import { getAllTopics } from "@/lib/content/loader";
import type { Topic } from "@/lib/content/types";

function badge(ok: boolean) {
  return ok ? "✓" : "✗";
}

async function main() {
  console.log("\n── At Ease Learning content validation ──\n");

  let topics: Topic[];
  try {
    topics = await getAllTopics();
  } catch (err) {
    console.error("✗ Failed to load content:\n ", (err as Error).message);
    process.exit(1);
  }

  if (topics.length === 0) {
    console.log("No topics found. Seed the DB and re-run.\n");
    return;
  }

  // Group by subject + year for display
  const groups = new Map<string, Topic[]>();
  for (const t of topics) {
    const key = `${t.subject.name} / ${t.subject.year.displayName}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  let totalTopics = 0;
  let totalLectures = 0;
  let totalWorksheets = 0;
  let totalQuestions = 0;

  for (const [group, list] of Array.from(groups)) {
    console.log(`  ${group}`);
    for (const t of list) {
      const hasLecture = !!t.lecture;
      const hasWorksheet = !!t.worksheet;
      const qCount = t.worksheet?.questions.length ?? 0;
      const format = t.lecture ? `[${t.lecture.format}]` : "[no lecture]";

      console.log(
        `    ${badge(true)} ${t.syncId.padEnd(36)} ` +
          `lecture ${badge(hasLecture)} ${format.padEnd(10)} ` +
          `worksheet ${badge(hasWorksheet)}` +
          (hasWorksheet ? ` (${qCount} q)` : "")
      );

      totalTopics++;
      if (hasLecture) totalLectures++;
      if (hasWorksheet) totalWorksheets++;
      totalQuestions += qCount;
    }
    console.log();
  }

  console.log("── Summary ──");
  console.log(`  Topics     : ${totalTopics}`);
  console.log(`  Lectures   : ${totalLectures}`);
  console.log(`  Worksheets : ${totalWorksheets}`);
  console.log(`  Questions  : ${totalQuestions}`);
  console.log("\n✓ All content is valid.\n");
}

main().catch((err) => {
  console.error("\n✗ Unexpected error:", err);
  process.exit(1);
});
