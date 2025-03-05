import { Hono } from 'hono';
import * as R from 'remeda';
import { zValidator } from '@hono/zod-validator';
import Music from '@/entities/music/music';
import { categoryIdSchema } from './validation';
import type { MusicCategory, MusicQuestion } from '@/database/schema/music';

type PartialMusicCategory = Pick<
  MusicCategory,
  'categoryId' | 'name' | 'description'
>;

type PartialAggregatedMusicCategory = PartialMusicCategory & {
  questions: Pick<
    MusicQuestion,
    'isRequired' | 'placeholder' | 'question' | 'questionId'
  >[];
};

const routes = new Hono()
  .get('/category', async (c) => {
    const $musics = await Music.listAvailableCategories();

    const musics: PartialMusicCategory[] = $musics.map((item) =>
      R.pick(item, ['categoryId', 'name', 'description'])
    );

    return c.json(musics, 201);
  })
  .get(
    '/category/specific',
    zValidator('query', categoryIdSchema),
    async (c) => {
      const { categoryId } = c.req.valid('query');

      const $music = new Music(categoryId);
      const $musicCategory = await $music.category;

      const musicCategory: PartialAggregatedMusicCategory = {
        ...R.pick($musicCategory, ['categoryId', 'description', 'name']),
        questions: R.pipe(
          $musicCategory.questions,
          R.filter((item) => !item.deprecated),
          R.map((item) =>
            R.pick(item, [
              'isRequired',
              'placeholder',
              'question',
              'questionId',
            ])
          )
        ),
      };

      return c.json(musicCategory, 201);
    }
  );

export type MusicRoutes = typeof routes;

export default routes;
