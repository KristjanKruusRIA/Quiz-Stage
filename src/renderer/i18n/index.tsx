import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Language } from '../../shared/game/types';
import { en, type TranslationKey } from './en';
import { et } from './et';

export { en, type TranslationKey } from './en';
export { et } from './et';

type PlaceholderNames<Value extends string> = Value extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PlaceholderNames<Rest>
  : never;
type TranslationParams<Key extends TranslationKey> = Record<PlaceholderNames<(typeof en)[Key]>, string | number>;
type TranslationArguments<Key extends TranslationKey> = [PlaceholderNames<(typeof en)[Key]>] extends [never]
  ? []
  : [params: TranslationParams<Key>];

const dictionaries = { en, et } as const;
const placeholderPattern = /\{([^{}]+)\}/g;

function placeholders(template: string): string[] {
  return [...template.matchAll(placeholderPattern)].map((match) => match[1]).sort();
}

for (const key of Object.keys(en) as TranslationKey[]) {
  if (placeholders(en[key]).join('|') !== placeholders(et[key]).join('|')) {
    throw new Error(`I18N_PLACEHOLDER_MISMATCH:${key}`);
  }
}

export function translate<Key extends TranslationKey>(
  locale: Language,
  key: Key,
  ...args: TranslationArguments<Key>
): string {
  const template: string = dictionaries[locale][key];
  const required = placeholders(template);
  const params = (args[0] ?? {}) as Record<string, unknown>;
  const paramsProvided = args[0] !== undefined;
  if (paramsProvided !== (required.length > 0)
    || Object.keys(params).sort().join('|') !== required.join('|')
    || Object.values(params).some((value) => typeof value !== 'string' && typeof value !== 'number')) {
    throw new Error('I18N_PARAMS_MISMATCH');
  }
  return template.replace(placeholderPattern, (_match, name: string) => String(params[name]));
}

export type Translate = <Key extends TranslationKey>(key: Key, ...args: TranslationArguments<Key>) => string;

const invokeTranslation = translate as unknown as (
  locale: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export function createTranslator(locale: Language): Translate {
  return ((key: TranslationKey, params?: Record<string, string | number>) =>
    invokeTranslation(locale, key, params)) as Translate;
}

interface I18nValue { locale: Language; t: Translate }

const defaultValue: I18nValue = {
  locale: 'en',
  t: createTranslator('en'),
};

const I18nContext = createContext<I18nValue>(defaultValue);

export function I18nProvider({ locale, children }: { locale: Language; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => ({
    locale,
    t: createTranslator(locale),
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** Plurals are explicit dictionary keys; only the numeric value 1 selects `one`. */
export function pluralKey<One extends TranslationKey, Other extends TranslationKey>(
  count: number,
  keys: { one: One; other: Other },
): One | Other {
  return count === 1 ? keys.one : keys.other;
}

export function formatNumber(locale: Language, value: number): string {
  return new Intl.NumberFormat(locale === 'et' ? 'et-EE' : 'en-GB', { maximumFractionDigits: 0 }).format(value);
}

export function formatDateTime(locale: Language, timestamp: number): string {
  return new Intl.DateTimeFormat(locale === 'et' ? 'et-EE' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }).format(timestamp);
}
