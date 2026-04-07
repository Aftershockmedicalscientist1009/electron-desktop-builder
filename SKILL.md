---
name: electron-desktop-builder
description: >
  Converts a web app (Express, React, Vite, Next.js) into an Electron desktop app.
  Use when starting a new Electron project from an existing web app, when setting up
  electron-builder for the first time, when creating main.ts/preload.ts boilerplate,
  when generating icon assets, or when configuring NSIS installers.
  Handles the full setup: project detection, main process, preload, icons, build config,
  installer, and first build. For troubleshooting existing builds, use electron-desktop-builds instead.
collection: smartbrain-activity
---

# Electron Desktop Builder

## Role

You convert existing web applications into Electron desktop apps. You generate all necessary files, modify existing configs, and produce a working first build.

**Companion skill:** [`electron-desktop-builds`](https://github.com/smartbrainactivity/electron-desktop-builds) handles troubleshooting, diagnostics, and repair when builds fail.

**When to use each:**
- **This skill** → Starting from scratch, first Electron setup, converting a web app
- **electron-desktop-builds** → Build fails, black screen, icons wrong, packaging errors

---

## Step 1 — Detect Project Type

Read `package.json` and key config files to determine:

```
1. Framework: Express, Vite, Next.js, Create React App, static
2. "type": "module" or "commonjs"?
3. Backend: Does the app have a server? (Express routes, API endpoints)
4. Build tool: Vite, webpack, esbuild, tsc
5. Existing Electron: Is there already an electron/ folder?
6. Icons: Does a logo exist? (SVG, PNG, ICO)
```

**Project types and their Electron approach:**

| Type | Approach | Window loads |
|------|----------|-------------|
| Express + React (SSR/API) | Embed Express in main process | `http://localhost:PORT` |
| Vite/CRA (static client) | Serve from file system | `file://dist/index.html` |
| Next.js | Embed server or export static | Depends on config |

If the project has a backend server (Express, Fastify, etc.), the server must be embedded inside Electron's main process on `127.0.0.1` with a random port.

---

## Step 2 — Collect Parameters

Ask the user or infer from context:

| Parameter | Default | Example |
|-----------|---------|---------|
| App name | From `package.json` name | `smart-prompter` |
| Product name | Capitalize app name + (Beta) | `Smart Prompter (Beta)` |
| App ID | `com.{org}.{name}` | `com.smartpromptingsuite.prompter` |
| Version | From `package.json` | `1.0.0-beta` |
| Install path | `C:\{Suite}\{app}` | `C:\Smart Prompting Suite\smart-prompter` |
| Window size | `1280x850` | Customizable |
| Has backend | Auto-detect | `true` if Express found |
| Icon source | Auto-detect | `logo.svg`, `icon.png`, etc. |
| Platforms | Windows NSIS | Can add Mac/Linux |

---

## Step 3 — Create `electron/` Directory

### 3a — `electron/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "../dist-electron",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["."]
}
```

### 3b — `electron/preload.ts`

Minimal context bridge. Always include:

```typescript
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});
```

Add domain-specific IPC handlers as needed (recording, panels, vault, etc.).

### 3c — `electron/main.ts`

The main process follows this structure (all sections are required unless marked optional):

**Section 1 — Splash screen** (optional)
```typescript
const splashLoaderPath = app.isPackaged
  ? path.join(process.resourcesPath, 'splash', 'splash-loader.js')
  : path.join(__dirname, '..', '..', 'shared', 'splash', 'splash-loader.js');
const { createSplashWindow, closeSplash } = require(splashLoaderPath);
```

**Section 2 — Single instance lock** (required)
```typescript
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }
else { app.on('second-instance', () => { /* focus existing window */ }); }
```

**Section 3 — App data path** (required)
```typescript
const appPath = app.isPackaged
  ? path.dirname(app.getPath('exe'))
  : path.join(__dirname, '..');
app.setPath('userData', appPath);
```

**Section 4 — Port finder** (only if embedding server)
```typescript
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        server.close(() => resolve(addr.port));
      } else { server.close(() => reject(new Error('No port'))); }
    });
  });
}
```

**Section 5 — Icon helpers** (required)
```typescript
function getAssetPath(filename: string): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'assets', filename)
    : path.join(app.getAppPath(), 'assets', filename);
}
```

**Section 6 — createMainWindow()** (required)
- BrowserWindow with preload, contextIsolation, no nodeIntegration
- Load URL: `http://localhost:${port}` (server) or `file://${dist}/index.html` (static)
- `show: false` until `ready-to-show`
- Close hides to tray unless `isQuitting`

**Section 7 — createTray()** (recommended)
- Context menu: Show + Quit
- Click toggles visibility

**Section 8 — app.whenReady()** (required)
1. Ensure data directories
2. Set environment variables (`NODE_ENV`, `DATA_DIR`, `ELECTRON_MAIN`)
3. Show splash (optional)
4. Start embedded server (if applicable)
5. Create window and tray
6. Register IPC handlers

**Section 9 — IPC handlers** (required)
- minimize-window, close-window, quit-app, open-external, get-app-version
- Add domain-specific handlers as needed

**Section 10 — Lifecycle** (required)
- `before-quit`: set isQuitting
- `window-all-closed`: quit on non-darwin
- `activate`: recreate window if none

---

## Step 4 — Generate Icon Assets

Icons are needed in multiple sizes for Windows:

| File | Size | Usage |
|------|------|-------|
| `icon.png` | 512x512 | Splash screen, app store |
| `icon16x16.ico` | 16x16 | Tray icon |
| `icon32x32.ico` | 32x32 | Small displays |
| `icon48x48.ico` | 48x48 | Medium displays |
| `icon256x256.ico` | 256x256 | Window, installer, taskbar |

**Generation script** (`script/generate-icons.cjs`):

Requires `sharp` and `to-ico` as dev dependencies. Converts SVG or PNG source to all required sizes. See `templates/generate-icons.cjs` for the reusable script.

---

## Step 5 — Create `installer.nsh`

NSIS installer config for custom install path:

```nsh
!macro preInit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "{{INSTALL_PATH}}"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "{{INSTALL_PATH}}"
!macroend

!macro customInit
  StrCpy $INSTDIR "{{INSTALL_PATH}}"
!macroend
```

Replace `{{INSTALL_PATH}}` with the target (e.g., `C:\Smart Prompting Suite\smart-prompter`).

---

## Step 6 — Modify `package.json`

### Metadata
```json
{
  "name": "{{APP_NAME}}",
  "version": "{{VERSION}}",
  "description": "{{DESCRIPTION}}",
  "main": "dist-electron/main.js"
}
```

### Scripts
```json
{
  "electron:dev": "npm run build && electron .",
  "electron:build": "npm run build && electron-builder --win nsis && node \"../scripts/fix-exe-icon.js\""
}
```

### Dev dependencies
```json
{
  "electron": "^39.8.6",
  "electron-builder": "^26.1.0"
}
```

### Build config
```json
{
  "build": {
    "appId": "{{APP_ID}}",
    "productName": "{{PRODUCT_NAME}}",
    "directories": { "output": "release" },
    "files": ["dist-electron/**/*", "dist/**/*", "node_modules/**/*"],
    "extraResources": ["assets/**/*"],
    "win": {
      "target": ["nsis"],
      "icon": "assets/icon256x256.ico",
      "signAndEditExecutable": false
    },
    "npmRebuild": false,
    "forceCodeSigning": false,
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "perMachine": true,
      "include": "installer.nsh",
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "{{SHORT_NAME}}",
      "artifactName": "${productName} Setup.${ext}"
    }
  }
}
```

---

## Step 7 — Modify Build Pipeline and Configs

### vite.config.ts
Add `base: './'` for portable file paths.

### .gitignore
Add `dist-electron/` and `release/`.

### Build script
After existing client/server build steps, add:
1. `tsc -p electron/tsconfig.json`
2. Write `dist-electron/package.json` with `{"type": "commonjs"}` (if root has `"type": "module"`)

---

## Step 8 — Modify Server (if Express Embedded)

The server entry point must:
1. Export `startServer(opts?)` function returning `{ httpServer, port }`
2. Accept `{ port?: number, host?: string }` options
3. Auto-start only when NOT in Electron: `if (!process.env.ELECTRON_MAIN) { startServer(); }`

This preserves the existing web mode unchanged.

---

## Step 9 — First Build

```bash
npm install                  # Install electron + electron-builder
npm run build                # Compile everything (client + server + electron)
npm run electron:dev         # Test: should show splash → main window
```

### Verification checklist
- [ ] Web mode (`npm run dev`) still works unchanged
- [ ] `electron:dev` shows splash then main window
- [ ] App is fully functional (API calls, streaming, data persistence)
- [ ] Tray icon visible with context menu
- [ ] Close button hides to tray (quit only from tray)
- [ ] Single instance lock prevents duplicate launches
- [ ] Data persists in `data/` alongside the executable

---

## Step 10 — Production Build

```bash
npm run electron:build       # Build + package + fix icon
```

### Installer verification
- [ ] Setup.exe has correct icon
- [ ] Installs to correct path
- [ ] Desktop and Start Menu shortcuts created
- [ ] App launches from shortcut
- [ ] Uninstaller works

---

## Common Issues → Use electron-desktop-builds

If any of these occur, switch to the companion skill:

- Build fails with dependency or packaging errors
- Black/white screen after launch
- Icons not showing in .exe, taskbar, or installer
- Code signing issues
- NSIS installer errors
- Native module compilation failures

See: [electron-desktop-builds](https://github.com/smartbrainactivity/electron-desktop-builds)

---

## Quick Reference: File Checklist

After running this skill, the project should have:

```
project/
├── electron/
│   ├── main.ts          ← NEW
│   ├── preload.ts       ← NEW
│   └── tsconfig.json    ← NEW
├── assets/
│   ├── icon.png         ← NEW (512x512)
│   ├── icon16x16.ico    ← NEW
│   ├── icon32x32.ico    ← NEW
│   ├── icon48x48.ico    ← NEW
│   └── icon256x256.ico  ← NEW
├── installer.nsh        ← NEW
├── package.json         ← MODIFIED (deps, scripts, build)
├── vite.config.ts       ← MODIFIED (base: './')
├── .gitignore           ← MODIFIED (dist-electron, release)
└── server/index.ts      ← MODIFIED (if Express embedded)
```
