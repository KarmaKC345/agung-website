import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  SUPABASE_URL: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  SUPABASE_JWT_SECRET: z.string().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().default('products'),
  OWNER_EMAIL: z.string().default(''),
  WEB_URL: z.string().default(''),
  REVALIDATE_SECRET: z.string().default(''),
  DEV_AUTH_TOKEN: z.string().default(''),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const env = schema.parse(source);
  if (env.NODE_ENV === 'production' || env.SUPABASE_URL) {
    // Token login pengembangan hanya untuk mode lokal tanpa Supabase. Begitu Supabase
    // diatur (pasti di server sungguhan) atau NODE_ENV=production, token ini diabaikan.
    env.DEV_AUTH_TOKEN = '';
  }
  return env;
}
