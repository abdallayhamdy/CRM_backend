import { z } from "zod";

const emptyToUndefined = z
  .string()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

// Standalone mode - all env vars are optional
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:8000/api'),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_MOCK_MODE: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

const coerced = z.object({
  UPSTASH_REDIS_REST_URL: emptyToUndefined,
  UPSTASH_REDIS_REST_TOKEN: emptyToUndefined,
});

const coercedValues = coerced.parse(process.env);
const processEnvWithCoerced = { ...process.env, ...coercedValues };

const parsed = envSchema.safeParse(processEnvWithCoerced);

if (!parsed.success && typeof window === "undefined") {
  console.warn(
    "⚠️ Environment variables warning (standalone mode):\n",
    parsed.error.flatten().fieldErrors
  );
}

export const env = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',

  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  SENTRY_DSN: process.env.SENTRY_DSN || undefined,
  NEXT_PUBLIC_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE || 'true',
} satisfies Env;
