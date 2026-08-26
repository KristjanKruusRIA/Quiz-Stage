import { z } from 'zod';
import { sourceUrlSchema } from './sourceUrl';

export const storedSourceV1Schema = z.strictObject({
  format: z.literal('quiz-stage-csv-v1'),
  title: z.string().trim().min(1),
  url: sourceUrlSchema,
  license: z.string().trim().min(1),
  retrievedAt: z.string().date(),
  translationStatus: z.enum(['untranslated', 'machine', 'reviewed']),
});

export const storedSourceV2Schema = storedSourceV1Schema.extend({
  format: z.literal('quiz-stage-csv-v2'),
  sourceId: z.string().trim().min(1),
  factualVerifiedAt: z.string().datetime({ offset: true }),
});

export const storedSourceSchema = z.discriminatedUnion('format', [storedSourceV1Schema, storedSourceV2Schema]);

export type StoredSourceV1 = z.infer<typeof storedSourceV1Schema>;
export type StoredSourceV2 = z.infer<typeof storedSourceV2Schema>;
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
