# 原生 Markdown 博客

这个目录只保存新博客的源稿；旧 Hexo 页面继续作为静态档案保留。生成器只会写入：

- `blog/index.html`
- `blog/posts/<slug>/index.html`
- `blog/media/`

它不会写入 `research/`，构建前后还会对 `research/` 做内容校验。

## 新建文章

```bash
python3 scripts/blog.py new "文章标题" --slug article-slug
```

生成的草稿位于 `_blog/posts/`。编辑完成后，把头部的 `draft: true` 改成 `draft: false`。

```yaml
---
title: "文章标题"
slug: article-slug
date: 2026-09-12
description: "显示在列表和搜索摘要中的一句话"
tags: [Multimodal, Engineering]
draft: false
---
```

正文支持标题、列表、引用、代码块、表格、图片、链接、删除线和 MathJax 数学公式。文章图片放在 `_blog/media/`，Markdown 中以 `/blog/media/文件名` 引用。

## 构建与本地预览

需要 Python 3 和 Pandoc：

```bash
brew install pandoc
python3 scripts/blog.py build
python3 -m http.server 8000
```

浏览器打开 `http://localhost:8000/blog/`。确认后，用保护脚本构建并暂存：

```bash
sh scripts/stage_blog.sh
git diff --cached
git commit -m "Publish: 文章标题"
git push origin master
```

保护脚本发现 `research/` 有任何改动时会立刻中止，而且只会暂存博客相关路径。GitHub Pages 会从 `master` 自动发布。不要再运行 `hexo deploy`。
