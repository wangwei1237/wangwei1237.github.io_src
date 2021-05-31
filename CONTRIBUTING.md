# 为站点贡献文章

## 增加文章指南
站点wangwei1237.gitee.io是基于hexo的博客站点，可以基于该站点的hexo源文件来提交新的文章。

#### 安装hexo
在提交新文章之前，首先需要安装hexo环境：
```
npm install hexo-cli -g
```

#### 创建新文章
```
https://github.com/wangwei1237/wangwei1237.github.io_src.git --depth 1
cd wangwei1237.github.io_src
npm install
hexo new post "the title for the new post"
```

#### 撰写文章并提交Pull Request
默认情况下，每篇新创建的文章头部都会包含如下的信息：
```
---
title: {{ title }}
date: {{ date }}
reward: false
top: false
authors:
categories:
tags:
---
```

其中authors为作者信息，该字段为数组类型，例如：
```
authors:
  - Author1
  - Author2
  - ...
```

然后完成新文章，直接提交一个Pull Request即可。

## 文章排版指南
文章的排版参考：[中文文案排版指北](https://github.com/sparanoid/chinese-copywriting-guidelines/blob/master/README.zh-CN.md)。
