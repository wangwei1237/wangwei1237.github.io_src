#!/bin/sh

HEXO=/usr/local/bin/hexo

$HEXO clean
$HEXO generate

cd public && \
rm -rf digital-video-concept && \
cp -r /Users/wangwei/Documents/Project/webroot/book/video digital-video-concept