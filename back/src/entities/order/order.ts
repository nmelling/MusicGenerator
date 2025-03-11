import { sql, desc } from 'drizzle-orm';
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

  constructor(orderId?: string) {
    this.$orderId = orderId || '';
    this.$order = null;

    if (orderId) this.init();
  }

  protected async init(): Promise<AggregatedOrder> {
    if (!this.$orderId)
      throw new HTTPException(400, { message: 'NO_ORDER_ID' });

    const order = await db.query.order.findFirst({
      where: (order, { eq }) => eq(order.orderId, String(this.$orderId)),
      with: {
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
    const order = await db.transaction(async (trx) => {
      const [inserted] = await trx
        .insert(dbConnector.schemas.order)
        .values({ email, categoryId })
        .returning();

      await trx
        .insert(dbConnector.schemas.answer)
        .values(
          answers.map((item) => ({ orderId: inserted.orderId, ...item }))
        );

      const order = trx.query.order.findFirst({
        where: (order, { eq }) => eq(order.orderId, inserted.orderId),
        with: {
          answers: true,
          musicCategory: true,
        },
      });

      return order;
    });

    if (!order)
      throw new HTTPException(400, { message: 'ORDER_NOT_GENERATED' });

    this.$order = {
      ...order,
      lyrics: [],
    };

    this.$orderId = order.orderId;

    return order.orderId;
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
    generatedLyrics: string
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
        await trx
          .update(dbConnector.schemas.lyrics)
          .set({ deprecated: true })
          .where(sql`${dbConnector.schemas.lyrics.orderId} = ${this.$orderId}`);

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
      // update parts only
    }
    if (!generatedLyrics)
      throw new HTTPException(400, { message: 'LYRICS_GENERATION_EMPTY' });
    // TODO: Récupérer le systemPromt + musicPrompt + answers

    return await this.$storeGeneratedLyrics(generatedLyrics);
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
