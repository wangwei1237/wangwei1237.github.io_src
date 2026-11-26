'use strict';

// Obsidian horizontal fences: Markdown columns separated by a standalone ---.
hexo.extend.filter.register('before_post_render', function (data) {
  data.content = data.content.replace(/^(`{3,}|~{3,})horizontal[^\S\n]*\n([\s\S]*?)^\1[^\S\n]*$/gm,
    (match, fence, body) => {
      const columns = body.split(/^---\s*$/m).map(column =>
        '<div class="ayer-horizontal-column">' +
        hexo.render.renderSync({ text: column.trim(), engine: 'markdown' }) + '</div>');
      return '<div class="ayer-horizontal">\n' + columns.join('\n') + '\n</div>\n';
    });
  // Keep Obsidian note titles readable without exposing its callout marker.
  if (data.source === '_posts/Verification-System.md') {
    data.content = data.content.replace(/^> \[!note\] (.+)$/gm, '> **$1**');
  }
  return data;
}, 8);
