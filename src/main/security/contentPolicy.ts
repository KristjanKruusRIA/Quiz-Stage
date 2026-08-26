import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
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

export interface AppProtocolPort<ResponseType = unknown> {
  handle(scheme: string, handler: (request: { url: string }) => Promise<ResponseType>): void;
  unhandle(scheme: string): void;
}

const REMOTE_SOURCE = /(https?:\/\/|wss?:\/\/|data:|blob:)/i;

function invalidAppProtocolRequest(): never {
  throw new Error('INVALID_APP_PROTOCOL_REQUEST');
}

export function resolveAppProtocolPath(rendererRoot: string, requestUrl: string): string {
  if (/%(?:2e|2f|5c)/i.test(requestUrl)) invalidAppProtocolRequest();
  try {
    const url = new URL(requestUrl);
    if (
      url.protocol !== 'app:'
      || url.hostname !== 'renderer'
      || url.username !== ''
      || url.password !== ''
      || url.search !== ''
      || url.hash !== ''
    ) invalidAppProtocolRequest();
    const root = realpathSync.native(rendererRoot);
    const candidate = realpathSync.native(path.resolve(root, `.${url.pathname}`));
    const relative = path.relative(root, candidate);
    if (
      relative === ''
      || relative === '..'
      || relative.startsWith(`..${path.sep}`)
      || path.isAbsolute(relative)
      || !statSync(candidate).isFile()
    ) invalidAppProtocolRequest();
    return candidate;
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_APP_PROTOCOL_REQUEST') throw error;
    return invalidAppProtocolRequest();
  }
}

export function registerAppProtocol<ResponseType>(
  protocol: AppProtocolPort<ResponseType>,
  rendererRoot: string,
  loadFile: (filePath: string) => Promise<ResponseType>,
): () => void {
  protocol.handle('app', async (request) => loadFile(resolveAppProtocolPath(rendererRoot, request.url)));
  return () => protocol.unhandle('app');
}

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
