import { describe, expect, it, vi } from 'vitest';
import { registerMediaProtocol } from '../../../src/main/media/mediaProtocol';

describe('media protocol', () => {
  it('serves GET and bodyless HEAD, rejects methods, returns complete 416 headers, and unregisters cleanly', async () => {
    let handler: ((request: Request) => Response | Promise<Response>) | undefined;
    const protocol = {
      handle: vi.fn((_scheme: string, next: (request: Request) => Response | Promise<Response>) => { handler = next; }),
      unhandle: vi.fn(),
    };
    const resolve = vi.fn(() => ({ key: 'opening' as const, source: 'bundled' as const, mime: 'audio/wav' as const, bytes: Buffer.from('RIFF') }));
    const dispose = registerMediaProtocol(protocol, { resolve });

    const get = await handler!(new Request('quiz-stage-media://asset/opening'));
    expect(get.status).toBe(200);
    expect(get.headers.get('Content-Length')).toBe('4');
    expect(Buffer.from(await get.arrayBuffer()).toString()).toBe('RIFF');

    const head = await handler!(new Request('quiz-stage-media://asset/opening', { method: 'HEAD' }));
    expect(head.status).toBe(200);
    expect(head.headers.get('Content-Length')).toBe('4');
    expect((await head.arrayBuffer()).byteLength).toBe(0);

    const method = await handler!(new Request('quiz-stage-media://asset/opening', { method: 'POST' }));
    expect(method.status).toBe(405);
    expect(method.headers.get('Allow')).toBe('GET, HEAD');

    const invalidRange = await handler!(new Request('quiz-stage-media://asset/opening', { headers: { Range: 'bytes=10-' } }));
    expect(invalidRange.status).toBe(416);
    expect(Object.fromEntries(invalidRange.headers)).toMatchObject({
      'accept-ranges': 'bytes',
      'content-length': '0',
      'content-range': 'bytes */4',
      'content-type': 'audio/wav',
    });

    dispose();
    expect(protocol.unhandle).toHaveBeenCalledWith('quiz-stage-media');
  });

  it('rejects arbitrary scheme, host, query, and fragment requests without resolving media', async () => {
    let handler: ((request: Request) => Response | Promise<Response>) | undefined;
    const protocol = { handle: (_scheme: string, next: typeof handler) => { handler = next; }, unhandle: vi.fn() };
    const resolve = vi.fn();
    registerMediaProtocol(protocol, { resolve });
    for (const url of [
      'https://asset/opening',
      'quiz-stage-media://other/opening',
      'quiz-stage-media://asset/opening?path=secret',
      'quiz-stage-media://asset/opening#secret',
    ]) expect((await handler!(new Request(url))).status).toBe(404);
    expect(resolve).not.toHaveBeenCalled();
  });
});
