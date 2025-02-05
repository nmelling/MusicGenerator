import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

import { dbConnector } from './database'
import music from './modules/music/music'
import lyrics from './modules/music/lyrics'

await dbConnector.migrateLatest()
if (Bun.env['NODE_ENV'] === 'development') await dbConnector.seedRandomly()

const app = new Hono().basePath('/api')

app.use('*', async (c, next) => {
  let origin = '*'
  if (Bun.env['NODE_ENV'] === 'production') origin = Bun.env['APP_BASE_URL']!

  const corsMiddlewareHandler = cors({
    origin,
  })
  return corsMiddlewareHandler(c, next)
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(err)
  return c.json({ error: 'Something went wrong' }, 500)
})

const routes = app
  .route('/music', music)
  .route('/lyrics', lyrics)


export type AppType = typeof routes

export default app
