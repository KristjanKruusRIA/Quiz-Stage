import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentEditorService } from '../../../src/main/content/contentEditorService';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';
import { registerIpc, type IpcMainPort } from '../../../src/main/ipc/registerIpc';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';

describe('content editor IPC', () => {
  const directories: string[] = [];
  const connections: DatabaseConnection[] = [];
  afterEach(() => {
    for (const connection of connections.splice(0)) if (connection.open) connection.close();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  it('keeps strict editor commands host-only and never accepts renderer IDs, paths, or ownership', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-editor-ipc-'));
    directories.push(directory);
    const databasePath = join(directory, 'content.sqlite');
    copyFileSync(resolve('resources/content/dev-seed.sqlite'), databasePath);
    const database = openDatabase({ filePath: databasePath });
    connections.push(database);
    const repository = new ContentRepository(database);
    const contentEditor = new ContentEditorService(database, repository, { createId: () => 'generated-id' });
    const handlers = new Map<string, (event: { sender: { id: number } }, input: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler), removeHandler: vi.fn(),
      on: vi.fn(), removeListener: vi.fn(),
    };
    const hostWindow = { webContents: { id: 10, send: vi.fn(), isDestroyed: () => false } };
    registerIpc({
      ipcMain, contentEditor,
      coordinator: {
        dispatch: vi.fn(), subscribe: vi.fn(() => () => undefined),
        getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null),
      },
      getWindows: () => ({ hostWindow, publicWindow: { webContents: { id: 20, send: vi.fn(), isDestroyed: () => false } } }),
    });

    const list = handlers.get(IPC_CHANNELS.contentList)!;
    const create = handlers.get(IPC_CHANNELS.contentCreatePack)!;
    await expect(list({ sender: { id: 20 } }, undefined)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(list({ sender: { id: 10 } }, { path: 'C:\\forbidden.sqlite' })).rejects.toThrow();
    await expect(create({ sender: { id: 10 } }, { name: 'Pack', id: 'renderer-id', ownership: 'custom' })).rejects.toThrow();
    await expect(create({ sender: { id: 10 } }, { name: 'Pack' })).resolves.toMatchObject({
      id: 'custom-generated-id', ownership: 'custom', categorySets: [], finalClues: [],
    });
    const response = await list({ sender: { id: 10 } }, undefined) as { packs: unknown[] };
    expect(response.packs.length).toBeGreaterThan(1);
    expect(JSON.stringify(response)).not.toContain(databasePath);
    expect(JSON.stringify(response)).not.toContain('state_json');
  });

  it.each(['board', 'final'] as const)('rejects hostile bundled %s save status at the main IPC boundary', async (kind) => {
    const directory = mkdtempSync(join(tmpdir(), `quiz-stage-editor-ipc-${kind}-`));
    directories.push(directory);
    const databasePath = join(directory, 'content.sqlite');
    copyFileSync(resolve('resources/content/dev-seed.sqlite'), databasePath);
    const database = openDatabase({ filePath: databasePath });
    connections.push(database);
    const repository = new ContentRepository(database);
    const contentEditor = new ContentEditorService(database, repository);
    const handlers = new Map<string, (event: { sender: { id: number } }, input: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler), removeHandler: vi.fn(),
      on: vi.fn(), removeListener: vi.fn(),
    };
    const hostWindow = { webContents: { id: 10, send: vi.fn(), isDestroyed: () => false } };
    registerIpc({
      ipcMain, contentEditor,
      coordinator: {
        dispatch: vi.fn(), subscribe: vi.fn(() => () => undefined),
        getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null),
      },
      getWindows: () => ({ hostWindow, publicWindow: { webContents: { id: 20, send: vi.fn(), isDestroyed: () => false } } }),
    });

    const bundled = contentEditor.list().packs.find((pack) => pack.ownership === 'bundled')!;
    const initial = kind === 'board' ? bundled.categorySets[0] : bundled.finalClues[0];
    const clue = 'clues' in initial ? initial.clues[0] : initial.clue;
    repository.reportClue({ clueId: clue.id, matchId: null, note: `IPC ${kind} report`, createdAt: 20 });
    const freshPack = contentEditor.list().packs.find((pack) => pack.id === bundled.id)!;
    const reported = kind === 'board'
      ? freshPack.categorySets.find((candidate) => candidate.id === initial.id)!
      : freshPack.finalClues.find((candidate) => candidate.id === initial.id)!;
    const hostile = structuredClone(reported);
    hostile.revision = 'renderer-controlled-revision';
    hostile.ownership = 'custom';
    hostile.eligibility = { en: false, et: false };
    const hostileClue = 'clues' in hostile ? hostile.clues[0] : hostile.clue;
    hostileClue.reported = false;
    delete hostileClue.report;
    const channel = kind === 'board' ? IPC_CHANNELS.contentSaveCategory : IPC_CHANNELS.contentSaveFinal;
    const payload = kind === 'board'
      ? { expectedRevision: reported.revision, categorySet: hostile }
      : { expectedRevision: reported.revision, finalClue: hostile };
    const beforeReports = structuredClone(repository.listReported());

    await expect(handlers.get(channel)!({ sender: { id: 10 } }, payload)).rejects.toThrow();
    expect(repository.listReported()).toEqual(beforeReports);
    expect(database.prepare('SELECT COUNT(*) FROM content_overrides WHERE clue_id = ?').pluck().get(clue.id)).toBe(0);
  });
});
