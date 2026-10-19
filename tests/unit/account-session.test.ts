import { beforeEach, expect, it, vi } from "vitest";

type JwtInput = { token: Record<string, unknown>; user?: { id: string }; account?: object };
const state = vi.hoisted(() => ({
  factory: undefined as
    | undefined
    | (() => { callbacks: { jwt: (input: JwtInput) => Promise<unknown> } }),
  findUser: vi.fn(),
}));
vi.mock("next-auth", () => ({
  default: (factory: typeof state.factory) => {
    state.factory = factory;
    return {
      handlers: { GET: vi.fn(), POST: vi.fn() },
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  },
}));
vi.mock("next-auth/providers/google", () => ({ default: () => ({ id: "google" }) }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }));
vi.mock("@/lib/prisma", () => ({ getPrisma: () => ({ user: { findUnique: state.findUser } }) }));
vi.mock("@/lib/env", () => ({
  getGoogleAuthEnv: () => ({ GOOGLE_CLIENT_ID: "test", GOOGLE_CLIENT_SECRET: "test" }),
}));
import "@/auth";

beforeEach(() => state.findUser.mockReset());
it("rejects an existing JWT when its account was deleted", async () => {
  state.findUser.mockResolvedValue(null);
  const jwt = state.factory!().callbacks.jwt;
  expect(await jwt({ token: { id: "deleted-user", sub: "deleted-user" } })).toBeNull();
});
it("keeps active accounts signed in", async () => {
  state.findUser.mockResolvedValue({ id: "active-user" });
  const token = { id: "active-user" };
  expect(await state.factory!().callbacks.jwt({ token })).toBe(token);
});
