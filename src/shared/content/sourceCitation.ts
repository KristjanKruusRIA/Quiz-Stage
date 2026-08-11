import { z } from 'zod';
import { sourceUrlSchema } from './sourceUrl';

const storedSourceSchema = z.strictObject({
  format: z.literal('quiz-stage-csv-v1'),
  title: z.string().trim().min(1),
  url: sourceUrlSchema,
  license: z.string().trim().min(1),
  retrievedAt: z.string().date(),
  translationStatus: z.enum(['untranslated', 'machine', 'reviewed']),
});

export function sourceCitation(value: string): string {
  try {
    const parsed = storedSourceSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data.title : value;
  } catch {
    return value;
  }
}
