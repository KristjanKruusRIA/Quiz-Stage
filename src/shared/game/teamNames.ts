export function normalizeTeamName(name: string): string {
  return name.normalize('NFKC').trim().toLocaleLowerCase('en-US');
}
