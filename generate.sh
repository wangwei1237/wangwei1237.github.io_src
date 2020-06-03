#!/bin/sh

HEXO=/usr/local/bin/hexo

$HEXO clean
$HEXO generate

cd public && \
rm -rf digital-video-concept && \
cp -r /$HOME/Documents/Project/webroot/book/video digital-video-concept

sed -i '' 's#<urlset.*#\<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\ <url>\ <loc>https://wangwei1237.github.io/digital-video-concept/</loc> \<lastmod>2020-03-03T02:55:11.212Z</lastmod> \ </url> #g' sitemap.xml

cp sitemap.xml bd_sitemap.xml && sed -i '' 's/github/gitee/g' bd_sitemap.xml