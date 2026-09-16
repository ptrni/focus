import { Env } from '@adonisjs/core/env'
export default await Env.create(new URL('../', import.meta.url), {
  HOST: Env.schema.string({ format: 'host' }), PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(), NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PG_HOST: Env.schema.string(), PG_PORT: Env.schema.number(), PG_USER: Env.schema.string(),
  PG_PASSWORD: Env.schema.string(), PG_DB_NAME: Env.schema.string(), FRONTEND_ORIGIN: Env.schema.string(),
})
