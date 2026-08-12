### Task 1: Scaffold the secure Electron/React workspace

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `forge.config.ts`
- Create: `vite.main.config.ts`
- Create: `vite.preload.config.ts`
- Create: `vite.renderer.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/main/main.ts`
- Create: `src/preload/preload.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/shared/appMeta.ts`
- Test: `tests/unit/appMeta.test.ts`

**Interfaces:**
- Consumes: approved design only.
- Produces: `APP_NAME`, `APP_VERSION`, a Forge/Vite build, and scripts `start`, `lint`, `typecheck`, `test`, `test:run`, `build`, `make:installer`, and `make:portable`.

- [ ] **Step 1: Install pinned runtime and build dependencies**

Run:

```powershell
npm init -y
npm install --save-exact react@19.2.8 react-dom@19.2.8 zod@4.4.3 electron-squirrel-startup@1.0.1
npm install --save-dev --save-exact electron@43.3.0 @electron-forge/cli@7.11.2 @electron-forge/maker-squirrel@7.11.2 @electron-forge/maker-zip@7.11.2 @electron-forge/plugin-vite@7.11.2 @vitejs/plugin-react@6.0.5 vite@8.2.1 typescript@7.0.2 tsx@4.23.12 vitest@4.1.10 eslint@10.8.1 typescript-eslint@8.67.0 eslint-plugin-react-hooks@7.1.1 @types/node@26.2.0 @types/react@19.2.18 @types/react-dom@19.2.4
```

Expected: `package-lock.json` pins the listed versions and `npm audit --omit=dev` reports no known runtime vulnerability.

- [ ] **Step 2: Write the first failing metadata test and configuration**

Create the configs listed above, set `package.json.main` to `.vite/build/main.js`, set `engines.node` to `>=24.15.0 <25`, and add:

```ts
// tests/unit/appMeta.test.ts
import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../../src/shared/appMeta';

describe('app metadata', () => {
  it('uses the approved working title and semantic version', () => {
    expect(APP_NAME).toBe('Quiz Stage');
    expect(APP_VERSION).toMatch(/^0\.1\.0$/);
  });
});
```

- [ ] **Step 3: Run the focused test and observe the expected failure**

Run: `npm run test:run -- tests/unit/appMeta.test.ts`

Expected: FAIL because `src/shared/appMeta.ts` does not exist.

- [ ] **Step 4: Implement the minimal secure shell**

Create:

```ts
// src/shared/appMeta.ts
export const APP_NAME = 'Quiz Stage';
export const APP_VERSION = '0.1.0';
```

Configure one sandboxed `BrowserWindow` with `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and the preload script. Render a React heading containing `APP_NAME`; do not enable DevTools in packaged builds.

- [ ] **Step 5: Verify the scaffold**

Run:

```powershell
npm run lint
npm run typecheck
npm run test:run -- tests/unit/appMeta.test.ts
npm run build
```

Expected: all four commands exit 0; the focused test reports `1 passed`.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json forge.config.ts vite.*.config.ts tsconfig.json eslint.config.mjs vitest.config.ts src tests/unit/appMeta.test.ts
git commit -m "build: scaffold secure Electron application"
```

