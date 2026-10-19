import { AlertCircle } from "lucide-react";

import { getAuthErrorMessage } from "@/lib/auth-errors";

type LoginErrorAlertProps = {
  error?: string | null;
};

export function LoginErrorAlert({ error }: LoginErrorAlertProps) {
  const message = getAuthErrorMessage(error);
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
