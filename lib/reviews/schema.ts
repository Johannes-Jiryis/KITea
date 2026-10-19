import { z } from "zod";

const halfStarRating = z.preprocess(
  (value) => {
    if (value === 0 || value === "" || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  },
  z
    .number({ required_error: "Rating is required" })
    .min(0.5, "Minimum rating is 0.5")
    .max(5, "Maximum rating is 5")
    .refine((rating) => Number.isInteger(rating * 2), {
      message: "Use half-star increments",
    }),
);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined));

export const reviewFormSchema = z.object({
  moduleId: z.string().min(1, "Select a module"),
  semesterTakenId: z.string().min(1, "Select the semester you took this module"),
  lecturerName: optionalText(120),
  lecturerReview: optionalText(5000),
  taName: optionalText(120),
  taReview: optionalText(5000),
  homeworkReview: optionalText(5000),
  examReview: optionalText(5000),
  summary: z
    .string()
    .trim()
    .min(20, "Write at least 20 characters in your summary")
    .max(5000, "Summary is too long (max 5000 characters)")
    .transform((value) => value.trim()),
  overallRating: halfStarRating,
  difficultyRating: halfStarRating,
  workloadRating: halfStarRating,
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
export const reviewPatchSchema = reviewFormSchema
  .omit({ moduleId: true, semesterTakenId: true })
  .partial();

export const reviewFormDefaultValues = {
  moduleId: "",
  semesterTakenId: "",
  lecturerName: "",
  lecturerReview: "",
  taName: "",
  taReview: "",
  homeworkReview: "",
  examReview: "",
  summary: "",
  overallRating: 0,
  difficultyRating: 0,
  workloadRating: 0,
} satisfies Record<keyof ReviewFormValues, string | number>;
