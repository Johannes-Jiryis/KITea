import Link from "next/link";
import { Coffee } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LoginErrorAlert } from "@/components/auth/login-error-alert";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { safeCallbackUrl } from "@/lib/auth-errors";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col pt-20">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
          <div className="w-full max-w-md">
            <div className="mb-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Coffee className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Welcome to KITea
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Sign in with your Google account to review modules and manage your profile.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/80 p-6 sm:p-8 shadow-sm backdrop-blur-sm">
              <LoginErrorAlert error={params.error} />

              <GoogleSignInButton callbackUrl={callbackUrl} />

              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                Google sign-in only. Your session stays active for 30 days.
              </p>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              <Link
                href="/"
                className="underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Back to home
              </Link>
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
