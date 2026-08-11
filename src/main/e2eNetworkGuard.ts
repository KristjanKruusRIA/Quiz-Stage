interface E2eNetworkGuardEnvironment {
  requested: boolean;
  isPackaged: boolean;
}

export function shouldInstallE2eNetworkGuard(environment: E2eNetworkGuardEnvironment): boolean {
  return environment.requested && !environment.isPackaged;
}
