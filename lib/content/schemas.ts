import { z } from "zod";

// ─── meta.json ────────────────────────────────────────────────────────────────

export const MetaSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  orderIndex: z.number().int().nonnegative(),
});

export type MetaFile = z.infer<typeof MetaSchema>;

// ─── lecture.md frontmatter ───────────────────────────────────────────────────

export const LectureFrontmatterSchema = z.discriminatedUnion("format", [
  z.object({
    format: z.literal("text"),
  }),
  z.object({
    format: z.literal("video"),
    youtubeId: z.string().min(1, "youtubeId is required for video lectures"),
    durationSeconds: z.number().int().positive().optional(),
  }),
  z.object({
    format: z.literal("slides"),
  }),
]);

export type LectureFrontmatter = z.infer<typeof LectureFrontmatterSchema>;

// ─── Question schemas ─────────────────────────────────────────────────────────

const McqSingleSchema = z.object({
  type: z.literal("mcq_single"),
  id: z.string().min(1),
  text: z.string().min(1),
  options: z.array(z.string()).min(2, "mcq_single needs at least 2 options"),
  answer: z.number().int().nonnegative(),
  explanation: z.string().optional(),
});

const McqMultiSchema = z.object({
  type: z.literal("mcq_multi"),
  id: z.string().min(1),
  text: z.string().min(1),
  options: z.array(z.string()).min(2, "mcq_multi needs at least 2 options"),
  answers: z.array(z.number().int().nonnegative()).min(1, "mcq_multi needs at least one correct answer"),
  explanation: z.string().optional(),
});

const ShortTextSchema = z.object({
  type: z.literal("short_text"),
  id: z.string().min(1),
  text: z.string().min(1),
  acceptedAnswers: z.array(z.string()).min(1, "short_text needs at least one accepted answer"),
  caseSensitive: z.boolean().optional(),
  explanation: z.string().optional(),
});

const NumericSchema = z.object({
  type: z.literal("numeric"),
  id: z.string().min(1),
  text: z.string().min(1),
  answer: z.number(),
  tolerance: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  explanation: z.string().optional(),
});

const EssaySchema = z.object({
  type: z.literal("essay"),
  id: z.string().min(1),
  text: z.string().min(1),
  hint: z.string().optional(),
});

export const QuestionSchema = z.discriminatedUnion("type", [
  McqSingleSchema,
  McqMultiSchema,
  ShortTextSchema,
  NumericSchema,
  EssaySchema,
]);

export const WorksheetFileSchema = z.object({
  title: z.string().min(1, "title is required"),
  questions: z.array(QuestionSchema).min(1, "worksheet must have at least one question"),
});

export type WorksheetFile = z.infer<typeof WorksheetFileSchema>;
