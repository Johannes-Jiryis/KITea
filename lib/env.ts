import { z } from "zod";

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    DATABASE_CA_CERT: z.string().startsWith("-----BEGIN CERTIFICATE-----").optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().optional(),
    SKIP_ENV_VALIDATION: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    for (const key of [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
    ] as const) {
      if (!env[key])
        ctx.addIssue({ code: "custom", path: [key], message: "Required in production" });
    }
    if (
      !env.NEXTAUTH_SECRET ||
      env.NEXTAUTH_SECRET.length < 32 ||
      /your-secret|development-secret|change-in-production/i.test(env.NEXTAUTH_SECRET)
    )
      ctx.addIssue({
        code: "custom",
        path: ["NEXTAUTH_SECRET"],
        message: "Use a random secret of at least 32 characters",
      });
    if (env.NEXTAUTH_URL && !env.NEXTAUTH_URL.startsWith("https://"))
      ctx.addIssue({
        code: "custom",
        path: ["NEXTAUTH_URL"],
        message: "HTTPS is required in production",
      });
    if (env.SKIP_ENV_VALIDATION?.toLowerCase() === "true")
      ctx.addIssue({
        code: "custom",
        path: ["SKIP_ENV_VALIDATION"],
        message: "Validation cannot be disabled in production",
      });
  });

export type Env = z.infer<typeof envSchema>;
let cached: Env | undefined;
export const getEnv = (): Env => {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Invalid configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  cached = result.data;
  return cached;
};
export const getGoogleAuthEnv = () => getEnv();
