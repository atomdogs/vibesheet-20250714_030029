import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().nonempty(),
  JWT_SECRET: z.string().min(32),
  LINKEDIN_CLIENT_ID: z.string().nonempty(),
  LINKEDIN_CLIENT_SECRET: z.string().nonempty(),
  CRM_BASE_URL: z.string().url(),
  CRM_API_KEY: z.string().nonempty(),
  SENTRY_DSN: z.string().url().or(z.literal('')).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
}).strict();

type AppConfig = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join('\n');
  throw new Error(`? Invalid environment variables:\n${formatted}`);
}

const config: AppConfig = parsed.data;

export default config;