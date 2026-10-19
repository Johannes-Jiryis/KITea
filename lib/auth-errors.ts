const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback: "Google sign-in was interrupted. Please try again.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  AccessDenied: "Access was denied. Please use an allowed Google account.",
  Configuration: "Authentication is not configured correctly.",
  Verification: "The sign-in link has expired. Please try again.",
  Default: "Something went wrong during sign-in. Please try again.",
};

export function getAuthErrorMessage(error: string | null | undefined) {
  if (!error) return null;
  return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default;
}

export function safeCallbackUrl(value: string | null | undefined, fallback = "/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}
