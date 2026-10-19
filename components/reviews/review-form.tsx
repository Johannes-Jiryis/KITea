"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";

import { createReview, updateReview, type ReviewFormOptions } from "@/app/actions/reviews";
import { HalfStarRating } from "@/components/reviews/half-star-rating";
import { MarkdownField } from "@/components/reviews/markdown-field";
import { ReviewFormSection } from "@/components/reviews/review-form-section";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { clearDraft, getDraftKey, loadDraft, saveDraft } from "@/lib/reviews/draft-storage";
import {
  reviewFormDefaultValues,
  reviewFormSchema,
  type ReviewFormValues,
} from "@/lib/reviews/schema";
import { cn } from "@/lib/utils";
import { ModulePicker } from "@/components/reviews/module-picker";

type ReviewFormProps = {
  options: ReviewFormOptions;
  mode: "create" | "edit";
  reviewId?: string;
  initialValues?: ReviewFormValues;
  defaultModuleId?: string;
  moduleLabel?: string;
};

export function ReviewForm({
  options,
  mode,
  reviewId,
  initialValues,
  defaultModuleId,
  moduleLabel,
}: ReviewFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const draftLoadedRef = useRef(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const defaults = useMemo(
    () => ({
      ...reviewFormDefaultValues,
      ...initialValues,
      moduleId: initialValues?.moduleId ?? defaultModuleId ?? "",
    }),
    [initialValues, defaultModuleId],
  );

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 500);

  const draftKey = useMemo(
    () =>
      getDraftKey(
        userId ?? "anonymous",
        watchedValues.moduleId || defaultModuleId || "none",
        reviewId,
      ),
    [userId, watchedValues.moduleId, defaultModuleId, reviewId],
  );

  useEffect(() => {
    if (!userId || draftLoadedRef.current || mode === "edit") return;
    const draft = loadDraft(draftKey);
    if (draft) {
      form.reset({ ...defaults, ...draft });
      setDraftSavedAt(new Date());
      toast({
        title: "Draft restored",
        description: "We loaded your saved draft for this review.",
      });
    }
    draftLoadedRef.current = true;
  }, [draftKey, defaults, form, mode, toast, userId]);

  useEffect(() => {
    if (!userId || mode === "edit") return;
    const hasContent =
      debouncedValues.summary?.trim() ||
      debouncedValues.lecturerReview?.trim() ||
      debouncedValues.homeworkReview?.trim();

    if (!hasContent) return;

    saveDraft(draftKey, debouncedValues);
    setDraftSavedAt(new Date());
  }, [debouncedValues, draftKey, mode, userId]);

  const onSubmit = useCallback(
    async (values: ReviewFormValues) => {
      setIsSubmitting(true);

      const result =
        mode === "edit" && reviewId
          ? await updateReview(reviewId, values)
          : await createReview(values);

      setIsSubmitting(false);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: mode === "edit" ? "Update failed" : "Submission failed",
          description: result.error,
        });
        return;
      }

      clearDraft(draftKey);
      toast({
        title: mode === "edit" ? "Review updated" : "Review submitted",
        description:
          mode === "edit"
            ? "Your changes have been saved."
            : "Thank you for sharing your experience.",
      });
      router.push("/my-reviews");
      router.refresh();
    },
    [mode, reviewId, draftKey, toast, router],
  );

  const isModuleLocked = mode === "edit" || !!defaultModuleId;
  if (!userId) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ReviewFormSection
          title="Module & semester"
          description="Which module did you take, and when?"
        >
          <FormField
            control={form.control}
            name="moduleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module</FormLabel>
                {isModuleLocked && moduleLabel ? (
                  <p className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 text-sm font-medium">
                    {moduleLabel}
                  </p>
                ) : (
                  <ModulePicker
                    value={field.value}
                    onChange={field.onChange}
                    label={options.modules.find((module) => module.id === field.value)?.label}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="semesterTakenId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Semester taken</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </ReviewFormSection>

        <ReviewFormSection
          title="Ratings"
          description="Half-star increments — tap the left or right side of each star."
        >
          <div className="grid gap-6 sm:grid-cols-3">
            {(
              [
                ["overallRating", "Overall"],
                ["difficultyRating", "Difficulty"],
                ["workloadRating", "Workload"],
              ] as const
            ).map(([name, label]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <HalfStarRating
                        value={field.value || 0}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        size="sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </ReviewFormSection>

        <ReviewFormSection
          title="Lecturer"
          description="Optional — share who taught the course and your thoughts."
        >
          <FormField
            control={form.control}
            name="lecturerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lecturer name</FormLabel>
                <FormControl>
                  <Input placeholder="optional" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lecturerReview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opinion about lecturer</FormLabel>
                <FormControl>
                  <MarkdownField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Teaching style, clarity, fairness…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ReviewFormSection>

        <ReviewFormSection title="Teaching assistant">
          <FormField
            control={form.control}
            name="taName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TA name</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taReview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opinion about TA</FormLabel>
                <FormControl>
                  <MarkdownField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Tutorial quality, helpfulness…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ReviewFormSection>

        <ReviewFormSection title="Coursework & exams">
          <FormField
            control={form.control}
            name="homeworkReview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Homework review</FormLabel>
                <FormControl>
                  <MarkdownField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Assignments, frequency, difficulty…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="examReview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exam review</FormLabel>
                <FormControl>
                  <MarkdownField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Format, fairness, preparation needed…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ReviewFormSection>

        <ReviewFormSection
          title="Summary & recommendation"
          description="Your overall takeaway — supports **markdown** formatting."
        >
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summary / recommendation</FormLabel>
                <FormControl>
                  <MarkdownField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Would you recommend this module? What should future students know?"
                    rows={6}
                    aria-invalid={!!form.formState.errors.summary}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ReviewFormSection>

        <div
          className={cn(
            "sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border/50",
            "bg-card/90 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {draftSavedAt && mode === "create" && (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>
                  Draft saved{" "}
                  {draftSavedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                if (mode === "create") clearDraft(draftKey);
                form.reset(defaults);
              }}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-36">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : mode === "edit" ? (
                "Save changes"
              ) : (
                "Submit review"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
