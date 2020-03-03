#!/bin/sh

HEXO=/usr/local/bin/hexo

$HEXO clean
$HEXO generate

cd public/digital-video-concept && \
rm -f index.html && \
cp -r /Users/wangwei/Documents/Project/webroot/book/video/* .