# Electron Desktop Builder — AI Skill for Antigravity · Claude Code · Gemini CLI · Cursor

![Electron Desktop Builder](assets/banner.svg)

[![Creator](https://img.shields.io/badge/Creator-SMARTbrain%20Activity-blue)](https://www.smartbrainactivity.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](/LICENSE)
[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-black?logo=google&logoColor=white)]()
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-blue?logo=anthropic&logoColor=white)]()
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-Compatible-4285F4?logo=google&logoColor=white)]()
[![Electron](https://img.shields.io/badge/Electron-Builder-47848F?logo=electron&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-Compatible-339933?logo=nodedotjs&logoColor=white)]()

An expert AI skill for AI coding assistants (like Claude, Antigravity, Cursor, etc.) designed to convert existing web applications into Electron desktop apps right from the chat or terminal.

[Leer en Espanol](README.es.md)

## What this skill does

Given an existing web application (Express, React, Vite, Next.js, or static), this skill generates all the files and configuration needed to produce a working Electron desktop app with an NSIS installer for Windows.

It handles:
1. **Project detection** — Identifies framework, backend, build tool
2. **Main process** — Creates `electron/main.ts` with splash, tray, single instance lock
3. **Preload bridge** — Creates `electron/preload.ts` with context-isolated IPC
4. **Icon generation** — Converts SVG/PNG logos to multi-size .ico files
5. **Installer config** — NSIS with custom install path, shortcuts, menu category
6. **Build pipeline** — Modifies package.json, vite config, build scripts
7. **Server embedding** — Wraps Express/Fastify servers inside the Electron main process

## Companion skill

This skill pairs with [**electron-desktop-builds**](https://github.com/smartbrainactivity/electron-desktop-builds) for troubleshooting:

| Skill | When to use |
|-------|------------|
| **electron-desktop-builder** (this) | Starting from scratch, first Electron setup |
| **electron-desktop-builds** | Build fails, black screen, icons wrong, packaging errors |

**Workflow:**
```
Web app → electron-desktop-builder → First build
                                          ↓
                                    Works? → Done
                                    Fails? → electron-desktop-builds → Fix → Rebuild
```

## Installation

```bash
# Clone into your AI skill directory
git clone https://github.com/smartbrainactivity/electron-desktop-builder.git

# For Claude Code:
# Place in ~/.claude/skills/ or your project's skills directory

# For other AI assistants:
# Place in your assistant's skill/knowledge directory
```

### Optional: Security audit

```bash
# If you have the companion skill installed:
node electron-desktop-builds/scripts/audit-scan.js electron-desktop-builder/
```

## Usage

Prompt your AI assistant with:

> "Convert this web app to an Electron desktop app"

> "Set up Electron for this Express + React project"

> "Create the Electron build for Windows with NSIS installer"

The skill will guide the assistant through the 10-step process defined in `SKILL.md`.

## Supported project types

| Framework | Backend | Approach |
|-----------|---------|----------|
| Express + React/Vite | Yes | Embed Express on localhost |
| Vite / CRA (static) | No | Load from file:// |
| Next.js (static export) | No | Load from file:// |
| Next.js (server) | Yes | Embed server on localhost |
| Any Node.js server | Yes | Embed on localhost |

## Files generated

After running the skill, your project will have:

```
project/
├── electron/
│   ├── main.ts          ← Main process
│   ├── preload.ts       ← Context bridge
│   └── tsconfig.json    ← CJS compilation config
├── assets/              ← Icon files (.ico, .png)
├── installer.nsh        ← NSIS install path
├── package.json         ← Modified (deps, scripts, build config)
├── vite.config.ts       ← Modified (base: './')
└── .gitignore           ← Modified (dist-electron, release)
```

## Scripts included

| Script | Purpose |
|--------|---------|
| `scripts/generate-icons.cjs` | Convert SVG/PNG to multi-size .ico files |

## Requirements

- **Node.js** 18+ (for sharp image processing)
- **npm** (for electron and electron-builder installation)
- No runtime dependencies — this is a knowledge-only skill with utility scripts

## Privacy

- No data is collected or transmitted
- All processing happens locally
- No API keys or credentials required

## Language

The skill adapts to whatever language you prompt in. Documentation is in English.

---

**Created by** [SMARTbrain Activity](https://smartpromptingsuite.com) | [info@smartpromptingsuite.com](mailto:info@smartpromptingsuite.com)

## License

[MIT](LICENSE)
