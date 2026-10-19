"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

type AuthGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're certain about the auth state
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [status, router]);

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show fallback if provided and not authenticated
  if (status === "unauthenticated" && fallback) {
    return <>{fallback}</>;
  }

  // Only render children if authenticated
  if (status === "authenticated") {
    return <>{children}</>;
  }

  // Default loading state
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
