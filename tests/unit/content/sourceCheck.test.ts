import { beforeEach, describe, expect, test, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  requestAll: true,
  dnsAddresses: [{ address: '93.184.216.34', family: 4 }],
  dnsHostname: '',
  connected: false,
  lookupResult: null as null | {
    error: Error | null;
    address: string | Array<{ address: string; family: number }>;
    family?: number;
  },
}));

vi.mock('node:dns', () => ({
  lookup: (
    hostname: string,
    options: { all?: boolean },
    callback: (error: Error | null, addresses: Array<{ address: string; family: number }>) => void,
  ) => {
    harness.dnsHostname = hostname;
    expect(options.all).toBe(true);
    callback(null, harness.dnsAddresses);
  },
}));

vi.mock('node:dns/promises', () => ({
  resolve4: async () => ['93.184.216.34'],
  resolve6: async () => [],
}));

vi.mock('node:https', () => ({
  request: (
    _url: URL,
    options: {
      lookup: (
        hostname: string,
        options: { all?: boolean },
        callback: (
          error: Error | null,
          address: string | Array<{ address: string; family: number }>,
          family?: number,
        ) => void,
      ) => void;
    },
    onResponse: (response: { statusCode: number; headers: Record<string, string>; destroy(): void }) => void,
  ) => {
    let onError: (error: Error) => void = () => {};
    return {
      on(event: string, listener: (error: Error) => void) {
        if (event === 'error') onError = listener;
        return this;
      },
      end() {
        options.lookup('example.test', { all: harness.requestAll }, (error, address, family) => {
          harness.lookupResult = { error, address, family };
          if (error !== null) { onError(error); return; }
          if (harness.requestAll && !Array.isArray(address)) {
            const invalid = Object.assign(new TypeError(`Invalid IP address: ${String(address)}`), { code: 'ERR_INVALID_IP_ADDRESS' });
            onError(invalid);
            return;
          }
          harness.connected = true;
          onResponse({ statusCode: 200, headers: {}, destroy() {} });
        });
      },
    };
  },
}));

import { checkSourceUrls } from '../../../scripts/content/sourceCheck';

async function checkHarnessUrl() {
  return (await checkSourceUrls(['https://example.test/source'], undefined, {
    concurrency: 1,
    maxAttempts: 1,
    timeoutMs: 1_000,
  }))[0];
}

describe('safe HTTPS DNS lookup', () => {
  beforeEach(() => {
    harness.requestAll = true;
    harness.dnsAddresses = [{ address: '93.184.216.34', family: 4 }];
    harness.dnsHostname = '';
    harness.connected = false;
    harness.lookupResult = null;
  });

  test('returns every validated address when Node requests all lookup results', async () => {
    harness.dnsAddresses = [
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ];

    await expect(checkHarnessUrl()).resolves.toMatchObject({ ok: true, status: 200, code: null });
    expect(harness.dnsHostname).toBe('example.test');
    expect(harness.lookupResult).toEqual({ error: null, address: harness.dnsAddresses, family: undefined });
    expect(harness.connected).toBe(true);
  });

  test('returns one validated address and family for a single-address lookup', async () => {
    harness.requestAll = false;

    await expect(checkHarnessUrl()).resolves.toMatchObject({ ok: true, status: 200, code: null });
    expect(harness.lookupResult).toEqual({
      error: null,
      address: '93.184.216.34',
      family: 4,
    });
    expect(harness.connected).toBe(true);
  });

  test.each([
    ['private resolution', [
      { address: '127.0.0.1', family: 4 },
    ]],
    ['mixed public and private resolution', [
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]],
    ['empty resolution', []],
  ])('rejects %s before connecting', async (_name, addresses) => {
    harness.dnsAddresses = addresses;

    await expect(checkHarnessUrl()).resolves.toMatchObject({
      ok: false,
      status: null,
      code: 'SOURCE_REQUEST_FAILED',
    });
    expect(harness.lookupResult?.error).toEqual(new Error('SOURCE_PRIVATE_ADDRESS'));
    expect(harness.connected).toBe(false);
  });
});
