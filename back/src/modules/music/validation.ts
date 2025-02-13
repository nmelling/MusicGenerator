import { z } from 'zod'

export const categoryIdSchema = z.object({
  categoryId: z.string().regex(/^\d+$/, 'Invalid categoryId').transform(Number),
})

export type CategoryId = z.infer<typeof categoryIdSchema>
