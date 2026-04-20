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

// ─── worksheet.json ───────────────────────────────────────────────────────────

const MultipleChoiceSchema = z.object({
  type: z.literal("multiple-choice"),
  id: z.string().min(1),
  text: z.string().min(1),
  options: z.array(z.string()).min(2, "multiple-choice needs at least 2 options"),
  answer: z.number().int().nonnegative(),
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

const FillBlankSchema = z.object({
  type: z.literal("fill-blank"),
  id: z.string().min(1),
  text: z.string().min(1),
  acceptedAnswers: z
    .array(z.string())
    .min(1, "fill-blank needs at least one accepted answer"),
  caseSensitive: z.boolean().optional(),
  explanation: z.string().optional(),
});

export const QuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceSchema,
  NumericSchema,
  FillBlankSchema,
]);

export const WorksheetFileSchema = z.object({
  title: z.string().min(1, "title is required"),
  questions: z.array(QuestionSchema).min(1, "worksheet must have at least one question"),
});

export type WorksheetFile = z.infer<typeof WorksheetFileSchema>;
