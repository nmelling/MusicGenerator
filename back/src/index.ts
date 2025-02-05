import { Hono } from 'hono'
import type { InferRequestType } from 'hono'
import { cors } from 'hono/cors'

import { dbConnector } from './database'
import music from './modules/music/music'
import lyrics from './modules/music/lyrics'

await dbConnector.migrateLatest()
if (Bun.env['NODE_ENV'] === 'development') await dbConnector.seedRandomly()

const app = new Hono()

app.use('*', async (c, next) => {
  let origin = '*'
  if (Bun.env['NODE_ENV'] === 'production') origin = Bun.env['APP_BASE_URL']!

  const corsMiddlewareHandler = cors({
    origin,
  })
  return corsMiddlewareHandler(c, next)
})

const routes = app
  .route('/music', music)
  .route('/lyrics', lyrics)

export type AppType = InferRequestType<typeof routes>

export default app
