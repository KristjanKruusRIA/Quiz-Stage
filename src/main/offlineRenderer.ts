import path from 'node:path';
import { realpathSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface RequestDetails {
  url: string;
  resourceType: string;
}

type BeforeRequestListener = (
  details: RequestDetails,
  callback: (response: { cancel: boolean }) => void,
) => void;

interface SessionPort {
  webRequest: {
    onBeforeRequest(
      filter: { urls: string[] },
      listener: BeforeRequestListener | null,
    ): void;
  };
}

interface OfflineRendererOptions {
  isPackaged: boolean;
  rendererRoot: string;
  devServerUrl?: string;
  onBlockedRequest?: (url: string, resourceType: string) => void;
}

const REQUEST_FILTER = { urls: ['<all_urls>'] };

export function resolveDevRendererRoot(_appPath: string, workingDirectory: string): string {
  return path.join(workingDirectory, 'src', 'renderer');
}

function viteOrigin(value: string | undefined): URL | null {
  if (value === undefined) return null;
  try {
    const url = new URL(value);
    const port = Number(url.port);
    if (
      url.protocol !== 'http:'
      || (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1')
      || url.port === ''
      || !Number.isInteger(port)
      || port < 1
      || port > 65_535
      || url.username !== ''
      || url.password !== ''
      || url.pathname !== '/'
      || url.search !== ''
      || url.hash !== ''
    ) throw new Error('invalid');
    return url;
  } catch {
    throw new Error('INVALID_VITE_DEV_SERVER_URL');
  }
}

function isOwnedFile(url: URL, rendererRoot: string): boolean {
  if (url.protocol !== 'file:' || url.hostname !== '' || url.search !== '' || url.hash !== '') return false;
  try {
    const requested = fileURLToPath(url);
    if (/^(?:\\\\|\\\\[?.]\\)/.test(requested)) return false;
    const candidate = realpathSync.native(requested);
    const relative = path.relative(rendererRoot, candidate);
    return relative !== ''
      && relative !== '..'
      && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative)
      && statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function isMediaRequest(url: URL): boolean {
  return url.protocol === 'quiz-stage-media:'
    && url.hostname === 'asset'
    && /^\/[a-z-]+$/.test(url.pathname)
    && url.username === ''
    && url.password === ''
    && url.search === ''
    && url.hash === '';
}

function isViteRequest(url: URL, origin: URL | null): boolean {
  if (origin === null || url.username !== '' || url.password !== '') return false;
  if (url.protocol === 'http:') return url.origin === origin.origin;
  return url.protocol === 'ws:'
    && url.hostname === origin.hostname
    && url.port === origin.port;
}

export function registerOfflineRendererPolicy(session: SessionPort, options: OfflineRendererOptions): () => void {
  const devOrigin = options.isPackaged ? null : viteOrigin(options.devServerUrl);
  let rendererRoot: string;
  try {
    rendererRoot = realpathSync.native(options.rendererRoot);
    if (!statSync(rendererRoot).isDirectory()) throw new Error('not-directory');
  } catch {
    throw new Error('INVALID_RENDERER_ROOT');
  }
  const listener: BeforeRequestListener = (details, callback) => {
    let allowed = false;
    try {
      const url = new URL(details.url);
      allowed = isOwnedFile(url, rendererRoot)
        || isMediaRequest(url)
        || isViteRequest(url, devOrigin);
    } catch {
      allowed = false;
    }
    if (!allowed) options.onBlockedRequest?.(details.url, details.resourceType);
    callback({ cancel: !allowed });
  };
  session.webRequest.onBeforeRequest(REQUEST_FILTER, listener);
  return () => session.webRequest.onBeforeRequest(REQUEST_FILTER, null);
}
