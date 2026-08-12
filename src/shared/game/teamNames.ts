export function normalizeTeamName(name: string): string {
  return name.normalize('NFKC').trim().toLocaleLowerCase('en-US');
}
export const TEAM_NAME_MAX_LENGTH = 32;
