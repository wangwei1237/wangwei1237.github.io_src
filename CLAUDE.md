# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Hexo-based blog site (wangwei1237.github.io) that generates static content and integrates multiple external books from separate repositories. The site is bilingual-capable (Chinese primary) and includes custom plugins for enhanced markdown rendering.

## Key Commands

### Content Creation
```bash
# Create new post
hexo new post "Post Title"

# Posts are created in source/_posts/ with front matter template from scaffolds/post.md
```

### Deployment
```bash
# Deploy & Release the site in the local environment

hexo server >/dev/null 2>&1 &  # Start local server in background
```

## Build and Release Architecture

### Standard Build Process
The site uses a multi-stage build process combining blog content with external books:

1. **Main Site Generation** (`hexo generate`)
   - Generates blog content to `public/` directory
   - Before generation, custom module patches are applied from `misc/` directory to `node_modules/`:
     - `bilibili-embed-convert/` - Custom bilibili video embed handling
     - `hexo-asset-image_index.js` - Modified asset image processing
     - `markdown-it-katex_index.js` - Custom KaTeX rendering
     - `@mdline/mdline-formatter-html/` - Custom MDLine formatting
     - `hexo-admonition/` - Custom admonition styling

2. **External Books Integration** (`build_books.sh`)
   - Downloads latest releases from separate GitHub book repositories:
     - chaos-engineering
     - digital_video_concepts
     - temperature-of-the-idioms
     - monolith-to-microservices
     - discovery-the-unpredictable-risk
     - Kubernetes-in-Action-Second-Edition
     - LLM_in_Action
     - introduction_to_probability_and_statistics
   - Books are fetched as tarball releases and extracted to `/books` directory

3. **Release Assembly** (`release.sh`)
   - Copies books from build location into `public/` directory
   - Injects book URLs into sitemap.xml
   - Creates dual sitemaps for GitHub Pages and Gitee (bd_sitemap.xml with github.io→gitee.io)
   - Copies files from `docs/` to `public/shares/` (excluding certain PDFs)

### CI/CD Pipeline (.github/workflows/release.yml)
Triggered on push to master or repository_dispatch events:
1. Applies module patches from `misc/` to `node_modules/`
2. Runs `hexo clean && hexo generate`
3. Executes `build_books.sh` to fetch external books
4. Executes `release.sh` to assemble final site
5. Deploys to wangwei1237.github.io repository

## Site Configuration

### Main Config (_config.yml)
- **Theme**: ayer (custom theme in `themes/ayer/`)
- **Deployment**: Dual deployment to GitHub
- **Markdown plugins**: emoji, abbr, footnote, ins, sub, sup
- **Post assets**: Enabled (`post_asset_folder: true`)
- **Permalink structure**: `:year/:month/:day/:title/`

### Content Structure
- `source/_posts/` - Blog posts (markdown)
- `source/aboutme/` - About page
- `source/books/` - Books index/landing pages
- `source/shares/` - Shared documents
- `docs/` - Static files copied to public/shares during build

### Post Front Matter Template
```yaml
---
title: {{ title }}
date: {{ date }}
reward: false
top: false
authors:
  - Author Name
categories:
  - Category
tags:
  - tag1
  - tag2
---
```

## Important Dependencies

### Hexo Plugins
- **hexo-admonition**: Custom admonition blocks (patched version in misc/)
- **hexo-asset-image**: Image asset handling (patched version in misc/)
- **hexo-renderer-markdown-it**: Primary markdown renderer with plugins
- **hexo-renderer-markdown-it-katex**: Math rendering
- **hexo-filter-mermaid-diagrams**: Mermaid diagram support
- **hexo-tag-bilibili**: Bilibili video embeds (uses patched bilibili-embed-convert)
- **hexo-tag-chart**: Chart.js integration
- **hexo-tag-echarts3**: ECharts visualization
- **hexo-generator-search**: Site search functionality
- **hexo-jupyter-notebook**: Jupyter notebook rendering
- **hexo-pdf**: PDF embedding support

## Critical Build Notes

1. **Module Patches Required**: Before running `hexo generate`, custom patches from `misc/` must be copied to `node_modules/`. These are not standard npm packages but modified versions required for correct rendering.

2. **Books Are External**: The books shown on the site are not in this repository. They come from separate repositories and are fetched during the build process via GitHub releases API.

3. **Dual Deployment**: The site deploys to both GitHub Pages (wangwei1237.github.io) and Gitee with URL transformations in sitemaps.

4. **Generate vs Deploy**: `hexo generate` only creates static files. Full deployment requires running the release.sh script to integrate books and prepare sitemaps.

## Contribution Workflow

Per CONTRIBUTING.md:
1. Fork/clone the repository
2. Install hexo-cli globally: `npm install hexo-cli -g`
3. Run `npm install` in project directory
4. Create new post: `hexo new post "Title"`
5. Edit post in `source/_posts/`
6. Add author name(s) to front matter authors array
7. Submit Pull Request

Writing style guide: Follow [Chinese Copywriting Guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines/blob/master/README.zh-CN.md)