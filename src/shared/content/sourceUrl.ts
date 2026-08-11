import { z } from 'zod';

export function isHttpSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

export const sourceUrlSchema = z.string().trim().refine(isHttpSourceUrl, 'Source URL must use HTTP or HTTPS without credentials');
