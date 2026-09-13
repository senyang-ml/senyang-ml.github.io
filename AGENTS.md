# AGENTS.md

本文件定义 `senyang-ml.github.io` 仓库的维护、博客生成和发布规则。仓库中的所有自动化工具与 AI Agent 均须遵守。

## 项目定位

这是 `https://senyang-ml.github.io/` 的 GitHub Pages 发布仓库，远端为：

```text
git@github.com:senyang-ml/senyang-ml.github.io.git
```

GitHub Pages 从 `master` 分支发布静态文件。仓库同时承载三个彼此隔离的内容区域：

1. 新博客：`/blog/`
2. 旧博客静态档案：`/blog/legacy/` 以及根目录下的旧文章和资源
3. Research 页面：`/research/`

根目录的 `index.html` 只负责跳转至 `/research/`，不得由博客构建器覆盖。

## 目录结构与所有权

```text
_blog/
├── README.md             # 博客写作和发布说明
├── posts/                # 新文章 Markdown 源稿
└── media/                # 新文章图片和附件源文件

scripts/
├── blog.py               # Markdown 静态页面生成器
└── stage_blog.sh         # 受保护的博客构建与暂存脚本

blog/
├── index.html            # 自动生成的新博客首页
├── assets/               # 新博客 CSS 和 JavaScript
├── posts/<slug>/         # 自动生成的新文章页面
├── media/                # 从 _blog/media/ 复制的发布资源
└── legacy/index.html     # 原 Hexo 博客首页的只读快照

2018/ 2019/ 2020/         # 原有博客文章，静态档案
page/ tags/ Archives/     # 原有分页、标签和归档页面
css/ js/ lib/ images/     # 原博客公共资源

research/                 # 独立 Research 静态站点
index.html                # 根路径到 /research/ 的跳转页
```

### 自动生成文件

以下内容由 `scripts/blog.py` 生成，不应直接手工编辑：

- `blog/index.html`
- `blog/posts/<slug>/index.html`
- `blog/media/` 中从 `_blog/media/` 复制的文件

需要修改文章内容时，应编辑 `_blog/posts/*.md` 后重新构建。

### 手工维护文件

- `blog/assets/native.css`
- `blog/assets/native.js`
- `scripts/blog.py`
- `scripts/stage_blog.sh`
- `_blog/README.md`

## 强制边界规则

### 1. 不再使用 Hexo

- 不得恢复或运行 `hexo generate`、`hexo clean`、`hexo deploy`。
- 不得引入 Hexo 配置、主题或部署插件。
- 新博客使用 Markdown + Python + Pandoc 生成纯静态 HTML。
- 当前仓库是最终发布仓库，不应再被其他静态站点生成器全量覆盖。

### 2. 旧博客必须保留

- `blog/legacy/` 和旧文章目录属于只读档案。
- 不得删除或批量重写 `2018/`、`2019/`、`2020/`、`page/`、`tags/`、`Archives/`、`css/`、`js/`、`lib/`、`images/` 中的历史内容。
- 如需修复旧站兼容问题，只允许做最小范围修改，并在修改前确认不会改变文章正文或视觉界面。
- 新文章一律发布到 `/blog/posts/<slug>/`，不得写入旧文章的年月路径。

### 3. Research 必须独立

- 未收到明确的 Research 修改请求时，禁止修改 `research/` 中的任何文件。
- 博客构建器只能写入 `blog/`，不得写入 `research/` 或根目录 `index.html`。
- `scripts/blog.py build` 会在构建前后计算 `research/` 内容摘要；摘要变化必须视为构建失败。
- `scripts/stage_blog.sh` 检测到 `research/` 存在已跟踪、未跟踪或已暂存改动时，必须中止博客暂存。
- 博客提交不得夹带 Research 改动。Research 改动必须单独检查、单独提交。
- 进入 `research/` 工作时，还必须同时遵守 `research/AGENTS.md`。

### 4. 公开页面保持极简

- 新博客公开页面不使用个人照片。
- 不得在公开页面展示构建命令、发布流程、本地文件路径、草稿提示、依赖安装说明或其他维护者信息。
- 写作与发布说明只允许保存在 `AGENTS.md`、`_blog/README.md` 和脚本帮助文本中。
- 首页只展示站点名称、简短定位、已发布文章列表，以及旧文章和 Research 导航。
- 顶部导航不重复显示旧博客归档入口；旧博客统一通过首页下方的 Archive 区域和文章页页脚进入。
- 没有新文章时不显示开发命令或操作提示。
- 文章正文必须在 JavaScript 未加载或执行失败时仍然可见；不得让长正文依赖 Intersection Observer 的可见比例才能显示。
- 手机端的长公式、代码块和表格应在内容区内横向滚动，不得撑破页面或遮挡正文。
- 新文章页的主内容在电脑端使用自然单栏阅读布局，标题、摘要和标签位于正文上方；左侧可以显示较窄、可折叠的文章大纲，但不得将标题与正文拆成左右两栏。

## 新文章工作流

### 1. 创建草稿

```bash
python3 scripts/blog.py new "文章标题" --slug article-slug
```

规则：

- Markdown 文件生成在 `_blog/posts/`。
- 文件名格式为 `YYYY-MM-DD-slug.md`。
- `slug` 只能包含小写英文字母、数字和连字符。
- 中文标题应显式提供英文或拼音 `--slug`。
- 新文章默认为 `draft: true`，不会被发布。

### 2. 编辑文章

文章必须包含以下头部信息：

```yaml
---
title: "文章标题"
slug: article-slug
date: 2026-09-12
description: "列表页和搜索摘要中显示的一句话"
tags: [Multimodal, Engineering]
draft: true
---
```

发布前将 `draft` 改为 `false`。

正文支持标准 Markdown，包括：

- 标题、段落、列表和引用
- 链接与图片
- 行内代码和围栏代码块
- 表格和删除线
- MathJax 行内及块级数学公式

文章图片或附件放入 `_blog/media/`，正文使用绝对路径引用：

```markdown
![图片说明](/blog/media/example.png)
```

### 3. 生成静态页面

```bash
python3 -B scripts/blog.py build
```

依赖：

- Python 3
- Pandoc；macOS 可通过 `brew install pandoc` 安装

构建行为：

- 只发布 `draft: false` 的文章。
- 按日期倒序生成新博客列表。
- 从 Markdown 生成 `/blog/posts/<slug>/index.html`。
- 复制 `_blog/media/` 到 `blog/media/`。
- 自动清理由本生成器创建、但已不再发布的文章目录。
- 不删除无法确认归属的目录。
- 构建期间不得改变旧博客或 Research 文件。

### 4. 本地预览

```bash
python3 -m http.server 8765
```

检查以下地址：

```text
http://localhost:8765/blog/
http://localhost:8765/blog/legacy/
http://localhost:8765/research/
```

至少确认：

- 新博客首页正常显示。
- 新文章正文、图片、代码、表格和公式正常显示。
- 桌面端和移动端布局可读。
- 新文章能返回 `/blog/`。
- 旧博客入口仍能打开。
- Research 页面没有视觉或功能变化。

## 提交与发布流程

### 博客专用暂存

不得对博客发布使用无范围限制的 `git add .`。使用：

```bash
sh scripts/stage_blog.sh
```

该脚本会：

1. 检查 `research/` 是否存在任何改动；存在则中止。
2. 重新运行博客构建。
3. 只暂存 `_blog/`、博客生成器和 `blog/` 相关文件。
4. 输出本次暂存文件列表供人工检查。

提交前必须运行：

```bash
git diff --cached
git status --short
```

确认暂存区不包含以下内容：

- `research/`
- 根目录 `index.html`
- 与当前文章无关的旧博客文件
- `.DS_Store` 或其他本地临时文件

确认后再提交和推送：

```bash
git commit -m "Publish: 文章标题"
git push origin master
```

推送后由 GitHub Pages 自动构建发布。不要运行任何 Hexo 部署命令。

## 修改生成器或前端时的验证

修改 `scripts/blog.py`、新博客样式或交互后，至少执行：

```bash
python3 -B -c "compile(open('scripts/blog.py', encoding='utf-8').read(), 'scripts/blog.py', 'exec')"
sh -n scripts/stage_blog.sh
node --check blog/assets/native.js
python3 -B scripts/blog.py build
git diff --check
git status --short
```

同时确认：

- `git status --porcelain -- research` 没有输出。
- `blog/legacy/index.html` 仍存在。
- 旧文章目录仍存在。
- 新生成页面包含正确的 canonical URL。
- 所有新博客内部链接使用 `/blog/` 前缀。

## Git 与安全规则

- 未经用户明确要求，不主动执行 `git push`。
- 不使用 `git reset --hard`、`git checkout --` 或其他破坏性命令清理用户改动。
- 不覆盖不属于本次任务的文件。
- 删除生成页面时，只能删除带有 `native-markdown-blog` 生成器标记且已不再对应已发布 Markdown 的目录。
- 构建失败时不得继续暂存、提交或推送。
- 每次发布前必须先查看差异和工作区状态。

## 当前发布关系

- `/`：跳转到 `/research/`
- `/research/`：Research 页面
- `/blog/`：新 Markdown 博客首页
- `/blog/posts/<slug>/`：新文章
- `/blog/legacy/`：旧 Hexo 博客首页快照
- `/2018/...`、`/2019/...`、`/2020/...`：旧文章永久链接

Research 与博客具有独立的源码和构建边界，但 GitHub Pages 仍会对同一个 `master` 分支进行整体静态部署。因此，发布隔离依靠目录所有权、构建摘要校验、精确暂存和独立提交共同保证。
