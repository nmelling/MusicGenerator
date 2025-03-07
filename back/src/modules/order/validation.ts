import { z } from 'zod';
import { generateNewLyricsPartSchema } from '@/entities/order/validation';

export const answerSchema = z.object({
  questionId: z.number().int().positive(),
  answer: z.string().nonempty(),
});

export const answersSchema = answerSchema.array().min(1);

export const newOrderSchema = z.object({
  answers: answerSchema.array(),
  email: z.string(),
  categoryId: z.number().int().positive(),
});

export const getOneOrderSchema = z.object({
  orderId: z.string().nonempty(),
});

export const newOrderLyricPartSchema = getOneOrderSchema.merge(
  generateNewLyricsPartSchema
);

export type NewOrderPayload = z.infer<typeof newOrderSchema>;
export type AnswerPayload = z.infer<typeof answerSchema>;
export type AnswersPayload = z.infer<typeof answersSchema>;
export type NewOrderLyricPart = z.infer<typeof newOrderLyricPartSchema>;
