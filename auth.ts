import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/auth.config";
import { getPrisma } from "@/lib/prisma";
import { getGoogleAuthEnv } from "@/lib/env";
import { databaseRead } from "@/lib/database/read";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(() => {
  try {
    const env = getGoogleAuthEnv();

    // Only include Google provider if credentials are available
    const providers = [];
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
      providers.push(
        Google({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              prompt: "consent",
              response_type: "code",
            },
          },
        }),
      );
    } else {
      console.warn("[Auth] Google OAuth credentials not provided. Google sign-in will not work.");
    }

    return {
      ...authConfig,
      adapter: PrismaAdapter(getPrisma()),
      session: {
        strategy: "jwt", // Switch to JWT to avoid edge runtime issues
        maxAge: THIRTY_DAYS,
        updateAge: 24 * 60 * 60,
      },
      providers,
      logger: {
        error(error) {
          console.error(
            JSON.stringify({
              level: "error",
              event: "auth.error",
              type: "type" in error ? String(error.type) : error.name,
            }),
          );
        },
        warn(code) {
          console.warn(JSON.stringify({ level: "warn", event: "auth.warning", code }));
        },
      },
      callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, account }) {
          // Initial sign in
          if (user && account) {
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.image = user.image;
          } else if (typeof token.id === "string") {
            // JWT cookies on other devices must stop authenticating a deleted account.
            const active = await databaseRead(() =>
              getPrisma().user.findUnique({
                where: { id: token.id as string },
                select: { id: true },
              }),
            );
            if (!active) return null;
          }
          return token;
        },
        async session({ session, token }) {
          if (token && session.user) {
            session.user.id = token.id as string;
            session.user.email = token.email as string;
            session.user.name = token.name as string;
            session.user.image = token.image as string;
          }
          return session;
        },
        redirect({ url, baseUrl }) {
          // Allows relative URLs
          const target = new URL(url, baseUrl);
          if (target.origin === new URL(baseUrl).origin) return target.href;
          // Default to home page
          return baseUrl;
        },
      },
      secret: env.NEXTAUTH_SECRET || "development-secret-change-in-production",
      trustHost: process.env.NODE_ENV !== "production" || !!env.NEXTAUTH_URL,
    };
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "auth.initialization" }));
    throw error;
  }
});
