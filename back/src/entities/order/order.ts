import { and, desc, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import * as R from 'remeda';

import db from '@/database/index';
import { dbConnector } from '@/database/index';
import type { AggregatedOrder } from '@/database/schema/order';
import type { AggregatedLyrics } from '@/database/schema/lyrics';
import type { AnswerPayload } from '@/modules/order/validation';
import {
  $generateLyrics,
  $extractLyricParts,
  type ExtractedLyricParts,
  $generateNewLyricsPart,
} from '@/entities/order/lyrics';
import {
  generateNewLyricsPartSchema,
  type GenerateNewLyricsPart,
  type LyricsPayload,
} from '@/entities/order/validation';
import Music from '@/entities/music/music';

class Order {
  protected $orderId: string;
  protected $order: AggregatedOrder | null;
  protected $maxLyricsPerOrder: number;

  constructor(orderId?: string) {
    this.$orderId = orderId || '';
    this.$order = null;
    this.$maxLyricsPerOrder = Number(Bun.env['MAX_LYRICS_PER_ORDER']) || 3;

    if (orderId) this.init();
  }

  protected async init(): Promise<AggregatedOrder> {
    if (!this.$orderId)
      throw new HTTPException(400, { message: 'NO_ORDER_ID' });

    const order = await db.query.order.findFirst({
      where: (order, { eq }) => eq(order.orderId, String(this.$orderId)),
      with: {
        // Regarder pour filter la donnée des colonnes
        lyrics: {
          with: {
            verses: true,
            refrain: true,
          },
        },
        answers: true,
        musicCategory: true,
      },
    });

    if (!order) throw new HTTPException(404, { message: 'ORDER_NOT_FOUND' });
    this.$order = order;

    return order;
  }

  public async createNewOrder(
    email: string,
    categoryId: number,
    answers: AnswerPayload[]
  ): Promise<string> {
    const orderId = await db.transaction(async (trx) => {
      const [inserted] = await trx
        .insert(dbConnector.schemas.order)
        .values({ email, categoryId })
        .returning({ orderId: dbConnector.schemas.order.orderId });

      await trx
        .insert(dbConnector.schemas.answer)
        .values(
          answers.map((item) => ({ orderId: inserted.orderId, ...item }))
        );

      return inserted.orderId;
    });

    if (!orderId)
      throw new HTTPException(400, { message: 'ORDER_NOT_GENERATED' });

    this.$orderId = orderId;
    await this.init();

    return orderId;
  }

  protected async $formatLyricPayload(): Promise<LyricsPayload> {
    if (!this.$order)
      throw new HTTPException(404, { message: 'ORDER_NOT_FOUND' });

    const [systemPromptRow] = await db
      .select()
      .from(dbConnector.schemas.systemPrompt)
      .limit(1)
      .orderBy(desc(dbConnector.schemas.systemPrompt.systemPromptId));
    if (!systemPromptRow) {
      // todo logger
      throw new HTTPException(500, { message: 'INTERNAL_SERVER_ERROR' });
    }

    const $music = new Music(this.$order.categoryId);
    const musicCategory = await $music.category;
    if (!musicCategory)
      throw new HTTPException(400, { message: 'MUSIC_CATEGORY_NOT_FOUND' });

    const aggregatedAnswers = await $music.checkAndAssignAnswers(
      this.$order.answers.map((item) => R.pick(item, ['questionId', 'answer']))
    );
    const formattedAnswers = R.pipe(
      aggregatedAnswers,
      R.map((item) => R.pick(item, ['prompt', 'answer']))
    );

    return {
      systemPrompt: systemPromptRow.prompt,
      musicPrompt: musicCategory.prompt,
      answers: formattedAnswers,
    };
  }

  protected async $storeGeneratedLyrics(
    generatedLyrics: string,
    isPartialLyricGeneration = false
  ): Promise<AggregatedLyrics> {
    const lyricParts: ExtractedLyricParts = $extractLyricParts(generatedLyrics);
    if (!lyricParts.sunoPrompt) {
      // todo logger
      throw new HTTPException(500, { message: 'WRONG_LYRICS_GENERATION' });
    }
    if (!lyricParts.layout.length) {
      // todo logger
      throw new HTTPException(500, { message: 'WRONG_LYRICS_GENERATION' });
    }

    let lyrics: AggregatedLyrics[] = [];

    try {
      lyrics = await db.transaction(async (trx) => {
        if (isPartialLyricGeneration) {
          const existingLyric = await trx.query.lyrics.findFirst({
            with: {
              verses: true,
              refrain: true,
            },
            where: and(
              eq(dbConnector.schemas.lyrics.orderId, this.$orderId),
              eq(dbConnector.schemas.lyrics.deprecated, false)
            ),
          });

          if (!existingLyric) {
            throw new HTTPException(404, {
              message: 'PREVIOUS_ACTIVE_LYRIC_NOT_FOUND',
            });
          }

          if (!lyricParts.refrain)
            lyricParts.refrain = existingLyric.refrain.text;

          lyricParts.verses = existingLyric.layout
            .map((layoutName) => {
              if (layoutName.toLowerCase().includes('chorus')) return '';
              let part =
                lyricParts.verses.find((text) => text.startsWith(layoutName)) ||
                '';
              if (!part)
                part =
                  existingLyric.verses.find((item) =>
                    item.text.startsWith(layoutName)
                  )?.text || '';
              if (!part) {
                // todo: logger
                console.error(
                  `Incomplete song: No text found for layout: ${layoutName}`
                );
              }
              return part;
            })
            .filter((text) => text.length > 0);

          lyricParts.layout = existingLyric.layout;
        }

        await trx
          .update(dbConnector.schemas.lyrics)
          .set({ deprecated: true })
          .where(eq(dbConnector.schemas.lyrics.orderId, this.$orderId));

        const [insertedLyrics] = await trx
          .insert(dbConnector.schemas.lyrics)
          .values({
            orderId: this.$orderId,
            sunoPrompt: lyricParts.sunoPrompt,
            layout: lyricParts.layout,
          })
          .returning();

        await trx.insert(dbConnector.schemas.refrain).values({
          lyricsId: insertedLyrics.lyricsId,
          text: lyricParts.refrain,
        });

        await trx.insert(dbConnector.schemas.verse).values(
          lyricParts.verses.map((verse) => ({
            lyricsId: insertedLyrics.lyricsId,
            text: verse,
          }))
        );

        const lyrics = await trx.query.lyrics.findMany({
          where: (lyrics, { eq }) => eq(lyrics.orderId, String(this.$orderId)),
          with: {
            verses: true,
            refrain: true,
          },
        });

        return lyrics;
      });
    } catch (err) {
      // todo: logger
      throw new HTTPException(500, { message: 'LYRICS_STORAGE_ERROR' });
    }

    if (this.$order) this.$order.lyrics = lyrics;

    const activeLyrics = lyrics.find((item) => !item.deprecated);
    if (!activeLyrics)
      throw new HTTPException(404, { message: 'NO_ACTIVE_LYRICS' });

    return activeLyrics;
  }

  public async generateLyrics(): Promise<AggregatedLyrics> {
    if (!this.$order)
      throw new HTTPException(404, { message: 'ORDER_NOT_FOUND' });

    const lyricsPayload = await this.$formatLyricPayload();

    const generatedLyrics = await $generateLyrics(lyricsPayload);
    if (!generatedLyrics)
      throw new HTTPException(400, { message: 'LYRICS_GENERATION_EMPTY' });

    return await this.$storeGeneratedLyrics(generatedLyrics);
  }

  public async generateNewLyricsPart(payload: GenerateNewLyricsPart) {
    const { success } = generateNewLyricsPartSchema.safeParse(payload);
    if (!success)
      throw new HTTPException(400, { message: 'INCORRECT_PAYLOAD_PROVIDED' });

    await this.init();
    if (!this.$order)
      throw new HTTPException(404, { message: 'ORDER_NOT_FOUND' });

    if (this.$order.lyrics.length === this.$maxLyricsPerOrder) {
      throw new HTTPException(400, {
        message: 'LYRICS_GENERATION_LIMIT_REACHED',
      });
    }

    const availableUpdatableLyrics = this.$order.lyrics.find(
      (lyric) => lyric.lyricsId === payload.lyricsId
    );
    if (!availableUpdatableLyrics)
      throw new HTTPException(404, { message: 'WRONG_LYRIC_PROVIDED' });
    if (availableUpdatableLyrics.deprecated)
      throw new HTTPException(400, { message: 'DEPRECATED_LYRIC_PROVIDED' });

    const lyricsPayload = await this.$formatLyricPayload();

    let generatedLyrics = '';
    if (!payload.selectedParts?.length) {
      generatedLyrics = await $generateLyrics(lyricsPayload);
    } else {
      generatedLyrics = await $generateNewLyricsPart({
        ...lyricsPayload,
        ...R.pick(payload, ['selectedParts']),
      });
    }
    if (!generatedLyrics)
      throw new HTTPException(400, { message: 'LYRICS_GENERATION_EMPTY' });

    return await this.$storeGeneratedLyrics(generatedLyrics, true);
  }

  get order() {
    return this.init();
  }

  get lyrics(): AggregatedLyrics | null {
    if (!this.$order || !this.$order.lyrics) return null;
    return this.$order.lyrics.find((item) => !item.deprecated) || null;
  }
}

export default Order;
