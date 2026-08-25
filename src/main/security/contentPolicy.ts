import { readFileSync } from 'node:fs';
import { registerOfflineRendererPolicy } from '../offlineRenderer';

export interface ContentPolicySession {
  webRequest: {
    onBeforeRequest(
      filter: { urls: string[] },
      listener: ((details: { url: string; resourceType: string }, callback: (response: { cancel: boolean }) => void) => void) | null,
    ): void;
  };
}

export interface ContentPolicyOptions {
  isPackaged: boolean;
  rendererRoot: string;
  devServerUrl?: string;
  contentSecurityPolicyPath: string;
  onBlockedRequest?: (url: string, resourceType: string) => void;
}

const REMOTE_SOURCE = /(https?:\/\/|wss?:\/\/|data:|blob:)/i;

function loadContentSecurityPolicy(filePath: string): string {
  const html = readFileSync(filePath, 'utf8');
  const match = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i.exec(html);
  if (match === null) throw new Error('INVALID_CONTENT_SECURITY_POLICY');
  const value = match[1];
  if (REMOTE_SOURCE.test(value)) throw new Error('INVALID_CONTENT_SECURITY_POLICY');
  return value;
}

export function registerContentPolicy(session: ContentPolicySession, options: ContentPolicyOptions): () => void {
  const policy = loadContentSecurityPolicy(options.contentSecurityPolicyPath);
  if (!policy.includes('quiz-stage-media:')) throw new Error('INVALID_CONTENT_SECURITY_POLICY');
  return registerOfflineRendererPolicy(session, {
    isPackaged: options.isPackaged,
    rendererRoot: options.rendererRoot,
    devServerUrl: options.devServerUrl,
    onBlockedRequest: options.onBlockedRequest,
  });
}

