import { Hono } from 'hono'
import type { InferRequestType } from 'hono'

import { dbConnector } from './database'
import music from './modules/music/music'
import lyrics from './modules/music/lyrics'

const app = new Hono()

await dbConnector.migrateLatest()
if (Bun.env['NODE_ENV'] === 'development') await dbConnector.seedRandomly()

const routes = app
  .route('/music', music)
  .route('/lyrics', lyrics)

export type AppType = InferRequestType<typeof routes>

export default app
