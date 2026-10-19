"use server";

import { auth, signOut } from "@/auth";
import { deleteOwnAccount } from "@/lib/accounts/delete-account";
import { invalidateReviews } from "@/lib/reviews/invalidate";
import { HttpError } from "@/lib/http/errors";

export const deleteAccount = async (
  confirmation: string,
): Promise<{ error: string } | { success: true }> => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to delete your account." };
  if (confirmation !== "DELETE") return { error: "Type DELETE to confirm account deletion." };
  let modules: string[];
  try {
    modules = await deleteOwnAccount(session.user.id);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "account.delete.failed" }));
    return {
      error:
        error instanceof HttpError
          ? error.message
          : "Could not delete your account. Please try again.",
    };
  }
  try {
    invalidateReviews(modules);
  } catch {
    // Deletion has committed; a cache failure must not prevent cookie cleanup.
    console.error(JSON.stringify({ level: "error", event: "account.delete.invalidation_failed" }));
  }
  // Keep Auth.js's redirect outside the catch; it also clears this browser's session cookies.
  await signOut({ redirectTo: "/" });
  return { success: true };
};
