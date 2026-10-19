import { revalidatePath } from "next/cache";

export const invalidateReviews = (moduleNumbers: string[]) => {
  for (const number of moduleNumbers) revalidatePath(`/modules/${encodeURIComponent(number)}`);
  revalidatePath("/");
  revalidatePath("/my-reviews");
  revalidatePath("/write-review");
};
