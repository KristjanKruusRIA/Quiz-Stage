import { z } from 'zod';
import { CSV_COLUMNS } from './csvColumns';
import { contentIdSchema, contentReportRecordSchema, localizedTextSchema } from './schema';
import { sourceUrlSchema } from './sourceUrl';
import { hasValidAcceptedResponseEscapes } from './acceptedResponses';

const text = z.string().trim().min(1);
const revisionSchema = z.string().min(1);
const ownershipSchema = z.enum(['bundled', 'custom']);
const eligibilitySchema = z.strictObject({ en: z.boolean(), et: z.boolean() });

export const editorSourceSchema = z.strictObject({
  title: text,
  url: sourceUrlSchema.nullable(),
  license: text.nullable(),
  retrievedAt: z.string().date().nullable(),
  translationStatus: z.enum(['untranslated', 'machine', 'reviewed']).nullable(),
});

export const editorClueSchema = z.strictObject({
  id: contentIdSchema,
  tier: z.number().int().min(0).max(5),
  value: z.number().int().nonnegative(),
  prompt: localizedTextSchema,
  response: localizedTextSchema,
  explanation: localizedTextSchema,
  acceptedResponses: localizedTextSchema.refine((value) =>
    hasValidAcceptedResponseEscapes(value.en)
      && (value.et === undefined || hasValidAcceptedResponseEscapes(value.et)),
  'Accepted responses contain an invalid escape').optional(),
  source: editorSourceSchema,
  enabled: z.boolean(),
  reported: z.boolean(),
  report: z.strictObject({ id: z.number().int().positive(), createdAt: z.number().int().nonnegative() }).nullable().optional(),
});

export const editorCategorySetSchema = z.strictObject({
  id: contentIdSchema,
  packId: contentIdSchema,
  revision: revisionSchema,
  ownership: ownershipSchema,
  round: z.enum(['round-one', 'round-two']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  macroTopic: text,
  name: localizedTextSchema,
  enabled: z.boolean(),
  eligibility: eligibilitySchema,
  clues: z.array(editorClueSchema).length(5),
});

export const editorFinalClueSchema = z.strictObject({
  id: contentIdSchema,
  packId: contentIdSchema,
  categoryId: contentIdSchema,
  revision: revisionSchema,
  ownership: ownershipSchema,
  difficulty: z.enum(['easy', 'medium', 'hard']),
  categoryName: localizedTextSchema,
  macroTopic: text,
  enabled: z.boolean(),
  eligibility: eligibilitySchema,
  clue: editorClueSchema,
});

export const editorPackSchema = z.strictObject({
  id: contentIdSchema,
  name: text,
  ownership: ownershipSchema,
  enabled: z.boolean(),
  revision: revisionSchema,
  categorySets: z.array(editorCategorySetSchema),
  finalClues: z.array(editorFinalClueSchema),
});

export const editorLibrarySchema = z.strictObject({
  packs: z.array(editorPackSchema),
  reports: z.array(contentReportRecordSchema),
});

const draftClueSchema = editorClueSchema.extend({ id: contentIdSchema.nullable() });
const createCategorySetSchema = z.strictObject({
  id: z.null(),
  packId: contentIdSchema,
  round: z.enum(['round-one', 'round-two']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  macroTopic: text,
  name: localizedTextSchema,
  enabled: z.boolean(),
  clues: z.array(draftClueSchema).length(5),
});

export const saveCategorySetRequestSchema = z.strictObject({
  expectedRevision: revisionSchema,
  categorySet: z.union([editorCategorySetSchema, createCategorySetSchema]),
});

const createFinalClueSchema = z.strictObject({
  id: z.null(),
  packId: contentIdSchema,
  categoryId: z.null(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  categoryName: localizedTextSchema,
  macroTopic: text,
  enabled: z.boolean(),
  clue: draftClueSchema,
});

export const saveFinalClueRequestSchema = z.strictObject({
  expectedRevision: revisionSchema,
  finalClue: z.union([editorFinalClueSchema, createFinalClueSchema]),
});

export const createContentPackRequestSchema = z.strictObject({ name: text });
export const deleteContentPackRequestSchema = z.strictObject({
  packId: contentIdSchema,
  expectedRevision: revisionSchema,
});
export const contentClueActionSchema = z.strictObject({
  clueId: contentIdSchema, reportId: z.number().int().positive(), expectedRevision: revisionSchema,
});
export const reportContentClueRequestSchema = z.strictObject({
  clueId: contentIdSchema, note: text, expectedRevision: revisionSchema,
});

export const contentImportIssueSchema = z.strictObject({
  code: text,
  message: text,
  row: z.number().int().positive().optional(),
  column: z.enum(CSV_COLUMNS).optional(),
});
export const contentImportPreviewSchema = z.union([
  z.strictObject({ cancelled: z.literal(true) }),
  z.strictObject({
    cancelled: z.literal(false), valid: z.literal(true), previewId: contentIdSchema, packId: contentIdSchema,
    packName: text, rowCount: z.number().int().positive(), conflict: z.boolean(),
    issues: z.array(contentImportIssueSchema).length(0),
  }), z.strictObject({
    cancelled: z.literal(false), valid: z.literal(false), packId: contentIdSchema.nullable(),
    packName: text.nullable(), rowCount: z.number().int().nonnegative(), conflict: z.boolean(),
    issues: z.array(contentImportIssueSchema).min(1),
  }),
]);
export const contentImportDiscardRequestSchema = z.strictObject({ previewId: contentIdSchema });
export const contentImportCommitRequestSchema = z.strictObject({
  previewId: contentIdSchema,
  conflict: z.enum(['replace-existing', 'keep-both']).optional(),
});
export const contentImportResultSchema = z.strictObject({
  packId: contentIdSchema, replaced: z.boolean(), keptBoth: z.boolean(), rowCount: z.number().int().positive(),
});
export const contentExportRequestSchema = z.strictObject({ packId: contentIdSchema });
export const contentExportResultSchema = z.discriminatedUnion('cancelled', [
  z.strictObject({ cancelled: z.literal(true) }),
  z.strictObject({
    cancelled: z.literal(false), packId: contentIdSchema, rowCount: z.number().int().positive(),
    bytes: z.number().int().positive(),
  }),
]);

export type EditorSource = z.infer<typeof editorSourceSchema>;
export type EditorClue = z.infer<typeof editorClueSchema>;
export type EditorCategorySet = z.infer<typeof editorCategorySetSchema>;
export type EditorFinalClue = z.infer<typeof editorFinalClueSchema>;
export type EditorPack = z.infer<typeof editorPackSchema>;
export type EditorLibrary = z.infer<typeof editorLibrarySchema>;
export type ContentImportPreview = z.infer<typeof contentImportPreviewSchema>;
export type ContentImportResult = z.infer<typeof contentImportResultSchema>;
export type ContentExportResult = z.infer<typeof contentExportResultSchema>;
