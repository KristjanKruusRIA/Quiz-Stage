export interface WindowSecurityPort {
  on(
    event: 'will-navigate',
    listener: (event: { preventDefault: () => void }) => void,
  ): unknown;
  setWindowOpenHandler(handler: () => { action: 'deny' }): void;
}

export function blockNavigationAndWindows(webContents: WindowSecurityPort): void {
  webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}
