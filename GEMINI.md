# GEMINI.md - Project Context

This is a **Hexo-based blog project** (wangwei1237.github.io) with a specialized build pipeline for integrating external content and custom rendering logic.

## Project Overview

- **Purpose**: Personal blog and technical documentation hosting.
- **Main Technologies**: 
    - [Hexo](https://hexo.io/) (v5.4.0) static site generator.
    - [Ayer](https://github.com/Shen-Yu/hexo-theme-ayer) theme.
    - Extensive use of Markdown-it with plugins for LaTeX (`katex`), diagrams (`mermaid`), and charts (`echarts`).
- **Key Characteristics**: 
    - Bilingual support (primarily Chinese).
    - Multi-stage build process involving custom module patches.
    - Integration of "books" from separate repositories as static releases.
    - Automated deployment via GitHub Actions (`.github/workflows/release.yml`).

## Building and Running

### Prerequisites
- Node.js (Version compatible with Hexo 5.4.0).
- `hexo-cli` (Recommended: `npm install -g hexo-cli`).

### Local Development
```bash
# Install dependencies
npm install

# Apply custom patches from misc/ (CRITICAL before hexo generate)
# Note: Manually copy files from misc/ to their respective node_modules locations as described in CLAUDE.md

# Start local server
hexo server

# Clean and generate static files
hexo clean && hexo generate
```

### Full Release Process
The full site assembly (including books) is handled by shell scripts:
1. `generate.sh`: Wrapper for `hexo generate`.
2. `build_books.sh`: Fetches external book releases from GitHub and extracts them to `public/books/`.
3. `release.sh`: Finalizes the release by copying books, injecting sitemap entries, and preparing dual-deployment files.

## Development Conventions

### Content Creation
- **New Post**: `hexo new post "Title"` (Generates file in `source/_posts/`).
- **Asset Folders**: Enabled (`post_asset_folder: true`). Images and other assets should be placed in a folder named after the post file.
  - **Commit Rule**: When adding or updating a post, ensure both the `.md` file and its corresponding asset folder (if created) are staged and committed together to avoid broken links. Always check `git status` before committing.
- **Front Matter**: Posts require specific fields:
  ```yaml
  ---
  title: Post Title
  date: YYYY-MM-DD HH:mm:ss
  authors:
    - Author Name
  categories:
    - Category
  tags:
    - tag1
  ---
  ```

### Coding & Writing Style
- **Chinese Copywriting**: Follow [Chinese Copywriting Guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines) (e.g., spacing between Chinese and English characters).
- **Custom Tags**: Use provided hexo tags for Bilibili (`{% bilibili video_id %}`), charts, and admonitions.

## Project Structure
- `source/_posts/`: Main blog content (Markdown).
- `misc/`: Contains custom patches for `node_modules` (Must be applied before build).
- `docs/`: Static PDF/documents copied to `public/shares/` during release.
- `scaffolds/`: Templates for new posts and pages.
- `themes/ayer/`: Current site theme.
- `public/`: Generated static site output (Created after `hexo generate`).
