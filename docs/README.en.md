# HexoHub

[中文文档](https://github.com/kivvs/HexoHub-private/blob/main/README.md)  |  [English](https://github.com/kivvs/HexoHub-private/blob/main/docs/README.en.md)  |  [Tauri Development Guide](https://github.com/kivvs/HexoHub-private/blob/main/docs/TAURI_DEVELOPMENT.md)  |  [Theme Management Guide](https://github.com/kivvs/HexoHub-private/blob/main/docs/THEME_MANAGEMENT.md)  |  [AI Features Guide](https://github.com/kivvs/HexoHub-private/blob/main/docs/AI_FEATURES.md)

[![GitHub Stars](https://img.shields.io/github/stars/kivvs/HexoHub-private)](https://github.com/kivvs/HexoHub-private/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/kivvs/HexoHub-private)](https://github.com/kivvs/HexoHub-private/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/kivvs/HexoHub-private)](https://github.com/kivvs/HexoHub-private/issues)
[![GitHub License](https://img.shields.io/github/license/kivvs/HexoHub-private)](https://github.com/kivvs/HexoHub-private)
[![GitHub all releases](https://img.shields.io/github/downloads/kivvs/HexoHub-private/total)](https://github.com/kivvs/HexoHub-private/releases)

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/185d93c6-836b-434a-a9b8-55400dc25f3e" 
    alt="image" 
    width="80%" 
  />
</div>

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/10fadb85-4fb7-438f-884d-b80e90886e5e" 
    alt="image" 
    width="80%" 
  />
</div>

A Hexo blog management desktop application built with Electron + Next.js, providing a graphical interface to replace traditional command-line operations.
> Say goodbye to tedious traditional command-line methods (I'm already tired of hexo xxxx🫠), manage your Hexo blog in a more elegant way.

# Features

## Article Management
In this application, you can visually: **Create new articles**, **View article list**, **Edit articles**, **Real-time preview**, **Start local preview**, **Generate and push static files**, **Delete articles**

## Markdown Editor Enhancements
- **Text color**: Palette in the toolbar adds `<font color>` to selected text (16 colors + custom picker + clear). Rendered by both Hexo and built-in preview
- **Rich text cleanup**: One-click removal of `<font style="...">` tags pasted from Yuque/Word, keeping only the text content
- **HTML rendering**: Preview supports inline HTML tags such as `<font style>`, `<span>`, `<br>`
- **Default text color fix**: Editor text always follows the theme variable - no more invisible "default white" text

## Image Drag & Drop & Extraction
**Drag & drop**: When you enable Hexo's asset folder feature ([What is this?](https://hexo.io/docs/asset-folders)), just drag a local image into the editor to automatically copy it to the asset folder and insert the `{% asset_img example.jpg %}` tag.

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/2aced4e0-ef08-4daf-af8b-6a31f43a2d56" 
    alt="image" 
    width="80%" 
  />
</div>

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/be796a74-7990-4780-a93e-4c3c72d07335" 
    alt="image" 
    width="80%" 
  />
</div>

**Image extraction**: One-click extraction of external images in a post (supports `<img src="...">` and Markdown syntax), downloading to `source/images`, renaming as `post-name-1.png`, auto-linking to the current post and replacing references.

**Image manager**: Unified management of `source/images` with grid/list views, filter by post tag, rename, delete and insert references.

## Blog Theme Management
- **Installed themes**: Automatically scans `themes/` and `node_modules/hexo-theme-*`, card-style display with name/version/source, one-click switching (updates `_config.yml`)
- **Smart validation & rollback**: After switching, `hexo clean + generate` runs automatically; on failure (missing layout templates, 0 files, etc.) the app **automatically rolls back** to the previous theme and regenerates - **no theme will ever produce a blank white page**
- **Non-Hexo detection**: Automatically detects Gatsby/Hugo/VitePress and other non-Hexo themes and disables switching
- **Online theme library**: Bundles the official hexo.io catalog (440+ themes with name/GitHub link/description/tags), search support, installed-state badges, and **one-click SSH download & install** to `themes/`
  - Three-layer loading: 30-day cache → bundled static catalog (instant, offline) → online refresh

See [📖 Theme Management Guide](./docs/THEME_MANAGEMENT.md) for details.

## Hexo Operations 
**Command Execution**: Graphically execute common Hexo commands, including:  
  - `hexo clean` - Clean cache files
  - `hexo generate` - Generate static files
  - `hexo deploy` - Deploy to remote server
  - `hexo serve` - Start local preview   
**Real-time Feedback**: Display command execution results and error messages  
**One-click publish**: clean → generate → deploy → push  
**Custom commands**: Fully customizable clean/generate/server/deploy commands

## Configuration Management
**Basic Settings**: Website title, subtitle, author, language, timezone, theme  
**Advanced Settings**: URL configuration, permalink format  
**YAML Editing**: Support direct editing of raw configuration files  
**Import/Export**: Configuration file backup and restore, making theme migration more convenient  
**Theme configs**: Support `_config.<theme>.yml` per-theme configuration (e.g. fluid)

## AI Features
- **AI Inspiration**: Generate writing inspiration based on your blog preferences
- **AI Analysis**: Analyze tags & publish stats, get encouraging feedback
- **AI Rewrite / Improve / Expand / Translate**: Right-click context menu in the editor
- **AI Deep Imitation**: Imitate the style of a selected post
- **AI Assistant Diagnosis (new)**: Describe a problem - the AI analyzes causes and suggests step-by-step solutions using software environment, system info, Hexo project path and recent operation logs

## App Interface Themes
Six themes: **System / Light / Dark / Ocean / Forest / Sunset**. One-click cycle from the toolbar, visual picker in settings, auto-saved and restored on next launch.

## Statistics
- **Tag cloud** with click-to-filter
- **Publish stats** chart by month
- **External analytics**: Giscus comments & GA4 views
- **Image-post linking**: images auto-linked to posts, filterable

# Quick Start  
## Usage

If you only need to "use" this application:   
- **Operating System**: Windows 10 or higher    
- **Storage**: Recommended 900MB available space  
- **Hexo**: https://hexo.io/
- **Npm**: `npm>10`    👉https://www.npmjs.com/
- **Node.js**: `nodejs>20`    👉https://nodejs.org/   

Then go to [Releases](https://github.com/kivvs/HexoHub-private/releases/) to download the latest version.  
  
## Development   

If you need to "develop" this application, here are the additional requirements:   
- **Git**: https://git-scm.com/   
- **nodejs**: `TypeScript>4.5`, `React>19`, `Next.js>15`   

⚠️ For speed considerations, I used `cnpm` during development and modified some `package.json` content. Please consider this when using. If you want to use `cnpm`, please execute:  

```bash
npm install -g cnpm --registry=http://registry.npm.taobao.org
```

Then you can replace `npm` with `cnpm`

### Electron Version Development

1. **Clone this repository**
   ```bash
   git clone https://github.com/kivvs/HexoHub-private.git
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode** - You can use it at this step
   ```bash
   npm run electron
   ```

4. **Package the application** (Optional)
   ```bash
   npm run build
   npm run make
   ```

> **Note**: This application is packaged with `electron-builder`, not `electron-forge`. When modifying related configuration files, please note to use the `electron-builder` configuration file format. [electron-builder](https://www.electron.build/)

### Tauri Version Development

The project now supports using Tauri as a desktop application framework, with smaller size and better performance.

1. **Switch to Tauri branch**
   ```bash
   git checkout tauri
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri:dev
   ```

4. **Build production version**
   ```bash
   npm run tauri:build
   ```

> **Note**: The Tauri version requires installing the Rust toolchain. It will be automatically downloaded on first run. For detailed development guide, please refer to [Tauri Development Guide](./TAURI_DEVELOPMENT.md).

## Linux Compatibility & Troubleshooting
The AppImage ships with an embedded Electron runtime. On some Arch / Manjaro / Wayland or Mesa driver setups you may see repeated console lines like:

```
GetVSyncParametersIfAvailable() failed for X times!
```

These are Chromium GPU / VSync timing warnings and usually harmless. To mitigate or suppress them:

1. The app already adds `--disable-gpu-vsync` internally to reduce spam.
2. If you still see flickering / blank window, run with GPU disabled:
  ```bash
  HEXOHUB_DISABLE_GPU=1 ./HexoHub-<version>.AppImage
  ```
3. On Wayland, Electron tries auto ozone platform detection. If window decorations or input behave oddly, try switching session (Wayland <-> X11).
4. In headless / remote desktop (llvmpipe / no real GPU) environments, prefer the `HEXOHUB_DISABLE_GPU=1` launch.

When reporting graphics issues, please include:
```
Distribution & version:
Desktop environment & session (X11/Wayland):
GPU vendor / driver (e.g. NVIDIA proprietary, Mesa AMD, Intel):
Whether HEXOHUB_DISABLE_GPU was required (yes/no):
```

If disabling GPU fully resolves the issue, open an Issue—we may add smarter auto detection paths.

# Tech Stack

- **Next.js 15** - React full-stack framework
- **React** - User interface library
- **TypeScript** - Type-safe JavaScript  
- **Tailwind CSS** - CSS framework  
- **Electron** - Cross-platform desktop application framework (main branch)
- **Tauri** - Lightweight desktop application framework (tauri branch)
- **Rust** - Systems programming language (Tauri backend)
- **electron-builder** - Electron application packaging tool
- **NSIS** - Windows installer creation tool
- **remark-gfm / rehype-raw** - Markdown parsing & HTML rendering
- [Hexo](https://hexo.io/) - Static blog generator

# Contributing Guidelines

Issues and Pull Requests are welcome!  
1. Fork the project
2. Create a feature branch
3. Commit changes
4. Create a Pull Request

---

I encountered many problems during development. If you can join this project and become a like-minded friend, I would be extremely grateful and buy you a cup of coffee! ☕
You can contact me through:
- Email: 3316703158@qq.com
- My blog: https://2am.top
- GitHub

## Internationalization (i18n)
This project uses `next-i18next` for internationalization. You can configure your language packs in `i18n.js`, aimed at helping your project easily support multiple languages, allowing users worldwide to use it without barriers.   

-  Multi-language support: Easily switch between different languages   
-  Simple integration: Quick to get started, compatible with mainstream frameworks   
-  Extensible: Custom translations and language packs  

```bash
# Install module
npm install your-i18n-module
```

```typescript
// Initialize
import i18n from 'your-i18n-module';

i18n.init({
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'zh', 'es', 'fr']
});
```

## Code Standards
No standards (actually my code is a mess👻), as long as what you write is human language

# LICENSE

This project uses the [MIT](https://choosealicense.com/licenses/mit/) license. Please comply with relevant laws and regulations when using this project.

# Changelog
For more logs, please check releases
## v3.8.x (Latest)
- **AI Assistant Diagnosis**: describe a problem and get AI-powered cause analysis & step-by-step solutions using software/system/project-log context
- **Online theme library**: bundled official hexo.io catalog (440+ themes) with search, one-click SSH install & switch
- **Smart theme validation & auto-rollback**: switching any theme auto-validates generation and rolls back on failure - no more blank pages
- **Non-Hexo theme detection**: auto-disables Gatsby/Hugo etc.
- **Editor text color** (16 colors + custom + clear) & **rich text cleanup** (`<font style>` tags)
- **Image extraction**: external images downloaded to source/images, renamed and linked to posts
- **Six app interface themes** (System/Light/Dark/Ocean/Forest/Sunset) with one-click cycle
- Fixed Markdown preview rendering of inline HTML tags (`<font style>` etc.)
- Fixed default editor text color

## v3 (2025-08-16)
New features:  
- Added right-click logic to the "Article List" interface for quick operations  
- Added "Tag Cloud" on the left side  
  
Bug fixes: 
- Fixed the issue where "Website Title" setting failed in Hexo configuration   
- Fixed occasional sorting confusion when "Sort by Article Name"  
- Fixed the error when generating static files when "Author" is empty  

## v2 (2025-08-13)
New features:  
- Refactored "Article List" functionality, placed it in the right main window   
- Added "Display articles by tags/categories" functionality   
- Added batch article processing (batch delete/add tags/add categories) 
- Added internationalization support   

Bug fixes:  
- Fixed some light/dark theme switching anomalies  

## v1 (2025-08-10)
- Initial build  
- Basic commands, article sorting by date/name  
- Basic functionality implementation
