import { parseBrandingRequest, parseMediaByteRange, parseMediaRequest, type MediaService } from './mediaService';

interface ProtocolPort {
  handle(scheme: string, handler: (request: Request) => Response | Promise<Response>): void;
  unhandle(scheme: string): void;
}

type MediaResolver = Pick<MediaService, 'resolve' | 'resolveBranding'>;

const SCHEME = 'quiz-stage-media';

export function registerMediaProtocol(protocol: ProtocolPort, media: MediaResolver): () => void {
  protocol.handle(SCHEME, (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Content-Length': '0' } });
    }
    try {
      const resolved = new URL(request.url).hostname === 'branding'
        ? media.resolveBranding(parseBrandingRequest(request.url))
        : media.resolve(parseMediaRequest(request.url));
      let range;
      try {
        range = parseMediaByteRange(request.headers.get('Range'), resolved.bytes.length);
      } catch {
        return new Response(null, { status: 416, headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '0',
          'Content-Range': `bytes */${resolved.bytes.length}`,
          'Content-Type': resolved.mime,
        } });
      }
      const bytes = range === null ? resolved.bytes : resolved.bytes.subarray(range.start, range.end + 1);
      const headers: Record<string, string> = {
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
        'Content-Length': String(bytes.length),
        'Content-Type': resolved.mime,
      };
      if (range !== null) headers['Content-Range'] = `bytes ${range.start}-${range.end}/${resolved.bytes.length}`;
      const body = request.method === 'HEAD' ? null : new Uint8Array(bytes);
      return new Response(body, { status: range === null ? 200 : 206, headers });
    } catch {
      return new Response(null, { status: 404, headers: { 'Content-Length': '0' } });
    }
  });
  return () => protocol.unhandle(SCHEME);
}
