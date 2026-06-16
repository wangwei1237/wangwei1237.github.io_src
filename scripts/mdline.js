'use strict';

const timelineStyle = `<style>
/* Based on https://github.com/CodyHouse/vertical-timeline */
.cd-timeline *, .cd-timeline *::after, .cd-timeline *::before {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}

.cd-timeline {
  font-size: 1.6rem;
  font-family: "Droid Serif", serif;
  color: #7f8c97;
  background-color: #e9f0f5;
  overflow: hidden;
  margin: 2em auto;
}

.cd-timeline a {
  color: #acb7c0;
  text-decoration: none;
}

.cd-timeline img {
  max-width: 100%;
}

.cd-timeline h1,
.cd-timeline h2 {
  font-family: "Open Sans", sans-serif;
  font-weight: bold;
}

.cd-timeline__container {
  position: relative;
  width: 90%;
  max-width: 1170px;
  margin: 0 auto;
  padding: 2em 0;
}

.cd-timeline__container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18px;
  height: 100%;
  width: 4px;
  background: #d7e4ed;
}

.cd-timeline__block {
  position: relative;
  margin: 2em 0;
}

.cd-timeline__block::after,
.cd-timeline__content::after {
  content: "";
  display: table;
  clear: both;
}

.cd-timeline__block:first-child {
  margin-top: 0;
}

.cd-timeline__block:last-child {
  margin-bottom: 0;
}

.cd-timeline__img {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #75ce66;
  -webkit-box-shadow: 0 0 0 4px white, inset 0 2px 0 rgba(0, 0, 0, 0.08), 0 3px 0 4px rgba(0, 0, 0, 0.05);
  box-shadow: 0 0 0 4px white, inset 0 2px 0 rgba(0, 0, 0, 0.08), 0 3px 0 4px rgba(0, 0, 0, 0.05);
}

.cd-timeline__content {
  position: relative;
  margin-left: 60px;
  background: white;
  border-radius: 0.25em;
  padding: 1em;
  -webkit-box-shadow: 0 3px 0 #d7e4ed;
  box-shadow: 0 3px 0 #d7e4ed;
}

.cd-timeline__content::before {
  content: '';
  position: absolute;
  top: 16px;
  right: 100%;
  height: 0;
  width: 0;
  border: 7px solid transparent;
  border-right: 7px solid white;
}

.cd-timeline__content h2 {
  color: #303e49;
}

.cd-timeline__content p,
.cd-timeline__date {
  font-size: 1.3rem;
}

.cd-timeline__content p {
  margin: 1em 0;
  line-height: 1.6;
}

.cd-timeline__date {
  display: inline-block;
  float: left;
  padding: .8em 0;
  opacity: .7;
}

@media only screen and (min-width: 768px) {
  .cd-timeline__content h2 {
    font-size: 2rem;
  }

  .cd-timeline__content p {
    font-size: 1.6rem;
  }

  .cd-timeline__date {
    font-size: 1.4rem;
  }
}

@media only screen and (min-width: 1170px) {
  .cd-timeline {
    margin-top: 3em;
    margin-bottom: 3em;
  }

  .cd-timeline__container::before {
    left: 50%;
    margin-left: -2px;
  }

  .cd-timeline__block {
    margin: 4em 0;
  }

  .cd-timeline__img {
    width: 50px;
    height: 50px;
    left: 50%;
    margin-left: -25px;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  .cd-timeline__content {
    margin-left: 0;
    padding: 1.6em;
    width: 45%;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  .cd-timeline__content::before {
    top: 24px;
    left: 100%;
    border-color: transparent;
    border-left-color: white;
  }

  .cd-timeline__date {
    position: absolute;
    width: 100%;
    left: 122%;
    top: 6px;
    font-size: 1.6rem;
  }

  .cd-timeline__block:nth-child(even) .cd-timeline__content {
    float: right;
  }

  .cd-timeline__block:nth-child(even) .cd-timeline__content::before {
    top: 24px;
    left: auto;
    right: 100%;
    border-color: transparent;
    border-right-color: white;
  }

  .cd-timeline__block:nth-child(even) .cd-timeline__date {
    left: auto;
    right: 122%;
    text-align: right;
  }
}
</style>`;

hexo.extend.tag.register('mdline', mdlineTag, {
  async: true,
  ends: true
});

async function mdlineTag(args, content) {
  const items = await parseItems(content || '');

  if (!items.length) {
    return '';
  }

  const body = items.map((item) => {
    const date = item.endDate ? `${item.beginDate} - ${item.endDate}` : item.beginDate;

    return `<div class="cd-timeline__block js-cd-block">
  <div class="cd-timeline__img cd-timeline__img--movie js-cd-img"></div>
  <div class="cd-timeline__content js-cd-content">
    <h2>${escapeHtml(item.title)}</h2>
    ${item.bodyHtml}
    <span class="cd-timeline__date">${escapeHtml(date)}</span>
  </div>
</div>`;
  }).join('\n');

  return `${timelineStyle}
<section class="cd-timeline js-cd-timeline">
  <div class="cd-timeline__container">
${body}
  </div>
</section>`;
}

async function parseItems(content) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const items = [];
  let current = null;

  for (const line of lines) {
    const heading = parseHeading(line);

    if (heading) {
      if (current) {
        items.push(await renderItem(current));
      }

      current = {
        ...heading,
        bodyLines: []
      };
      continue;
    }

    if (current) {
      current.bodyLines.push(line);
    }
  }

  if (current) {
    items.push(await renderItem(current));
  }

  return items;
}

function parseHeading(line) {
  const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);

  if (!heading) {
    return null;
  }

  const text = heading[1];
  const range = text.match(/^([\d-]{4,})--([\d-]{4,}):(.*)$/);

  if (range) {
    return {
      beginDate: range[1],
      endDate: range[2],
      title: range[3].trim()
    };
  }

  const single = text.match(/^([\d-]{4,}):(.*)$/);

  if (single) {
    return {
      beginDate: single[1],
      title: single[2].trim()
    };
  }

  return null;
}

async function renderItem(item) {
  const bodyMarkdown = item.bodyLines.join('\n').trim();
  const bodyHtml = bodyMarkdown
    ? await hexo.render.render({ text: bodyMarkdown, engine: 'markdown' })
    : '';

  return {
    ...item,
    bodyHtml
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char];
  });
}
