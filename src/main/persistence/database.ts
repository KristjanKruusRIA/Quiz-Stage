import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import BetterSqlite3 from 'better-sqlite3';

export type DatabaseConnection = BetterSqlite3.Database;

export interface OpenDatabaseOptions {
  filePath: string;
  readonly?: boolean;
}

export function openDatabase({ filePath, readonly = false }: OpenDatabaseOptions): DatabaseConnection {
  const resolvedPath = filePath === ':memory:' ? filePath : resolve(filePath);
  if (!readonly && resolvedPath !== ':memory:') mkdirSync(dirname(resolvedPath), { recursive: true });

  const database = new BetterSqlite3(resolvedPath, { readonly, fileMustExist: readonly });
  database.pragma('foreign_keys = ON');
  if (!readonly) database.pragma('journal_mode = WAL');
  return database;
}
