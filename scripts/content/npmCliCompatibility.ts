export function restoreNpmRunArgs(
  argv: readonly string[],
  valueOptions: readonly string[],
  booleanOptions: readonly string[] = [],
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  if (argv.some((argument) => argument.startsWith('--'))) return [...argv];
  const present = valueOptions.filter((option) => env[`npm_config_${option.slice(2).replaceAll('-', '_')}`] === 'true');
  const booleans = booleanOptions.filter((option) => env[`npm_config_${option.slice(2).replaceAll('-', '_')}`] === 'true');
  if (present.length === 0 && booleans.length === 0) return [...argv];
  if (argv.length !== present.length) throw new Error('npm-normalized content arguments do not match the documented command');
  return [
    ...present.flatMap((option, index) => [option, argv[index]]),
    ...booleans,
  ];
}
