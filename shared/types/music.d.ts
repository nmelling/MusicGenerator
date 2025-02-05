import {
  musicCategory,
  musicForm,
  musicQuestion,
} from '../database/schema/music'
import type { InferSelectModel } from 'drizzle-orm'
import app from '../../apps/back/src/modules/music/music'

export type MusicRoutes = typeof app

export type MusicCategory = InferSelectModel<typeof musicCategory>
export type MusicForm = InferSelectModel<typeof musicForm>
export type MusicQuestion = InferSelectModel<typeof musicQuestion>
