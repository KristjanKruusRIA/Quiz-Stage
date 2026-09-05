import type {
  LocalizedText,
  PlayableQuestion,
  PlayableSource,
} from '../playability/types';

export type EasyExpansionSource = PlayableSource;
export type EasyExpansionQuestion = PlayableQuestion & Readonly<{ clueId: string }>;

export type EasyExpansionCategory = Readonly<{
  categorySetId: string;
  batchId: string;
  packId: string;
  difficulty: 'easy';
  round: 'round-one' | 'round-two';
  macroTopic: string;
  name: LocalizedText;
  questions: readonly EasyExpansionQuestion[];
}>;

export type EasyExpansionBatchContract = Readonly<{
  batchId: string;
  packId: string;
  allowedMacroTopics: readonly string[];
  existingMacroTopicCounts: Readonly<Record<string, number>>;
  maxSetsPerMacroTopic: number;
}>;
