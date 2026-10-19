"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      refetchOnWindowFocus={true}
      refetchInterval={5 * 60} // Refetch every 5 minutes
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
