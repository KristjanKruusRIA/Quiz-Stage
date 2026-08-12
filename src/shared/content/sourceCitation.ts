import { z } from 'zod';
import { sourceUrlSchema } from './sourceUrl';

export const storedSourceSchema = z.strictObject({
  format: z.literal('quiz-stage-csv-v1'),
  title: z.string().trim().min(1),
  url: sourceUrlSchema,
  license: z.string().trim().min(1),
  retrievedAt: z.string().date(),
  translationStatus: z.enum(['untranslated', 'machine', 'reviewed']),
});

export type StoredSource = z.infer<typeof storedSourceSchema>;

export function parseStoredSource(value: string): StoredSource | null {
  try {
    const parsed = storedSourceSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function serializeStoredSource(value: StoredSource): string {
  return JSON.stringify(storedSourceSchema.parse(value));
}

export function sourceCitation(value: string): string {
  return parseStoredSource(value)?.title ?? value;
}
