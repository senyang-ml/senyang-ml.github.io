#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_dir"

research_state=$(git status --porcelain -- research)
if [ -n "$research_state" ]; then
  echo "❌ research/ 存在改动；为避免混合发布，本次博客暂存已中止。" >&2
  exit 1
fi

python3 -B scripts/blog.py build

git add -- \
  .gitignore \
  _blog \
  scripts/blog.py \
  scripts/stage_blog.sh \
  blog/index.html \
  blog/assets \
  blog/legacy

if [ -n "$(find blog/posts -type f -print -quit 2>/dev/null)" ]; then
  git add -- blog/posts
fi

if [ -d blog/media ]; then
  git add -- blog/media
fi

echo "✅ 只暂存了博客源稿、生成器和 blog/ 发布文件："
git diff --cached --name-only
echo "下一步请检查差异，再运行 git commit 和 git push。"
