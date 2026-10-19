import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/profile", "/write-review", "/my-reviews"];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname.startsWith(path));
}

function safeCallbackUrl(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/profile";
  }
  return value;
}

/**
 * Edge-safe Auth.js config (no Prisma/Node adapters).
 * Used by middleware; full providers/adapter live in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  trustHost: true,
  session: {
    strategy: "jwt", // Match the strategy in auth.ts
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      if (isProtectedPath(pathname) && !isLoggedIn) {
        const url = new URL("/login", request.nextUrl);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }

      if (pathname === "/login" && isLoggedIn) {
        const callbackUrl = safeCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));
        return NextResponse.redirect(new URL(callbackUrl, request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
