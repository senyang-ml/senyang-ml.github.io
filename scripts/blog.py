#!/usr/bin/env python3
"""Build the native Markdown blog without touching the research site."""

from __future__ import annotations

import argparse
import hashlib
import html
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, replace
from datetime import date, datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "_blog" / "posts"
MEDIA_DIR = ROOT / "_blog" / "media"
BLOG_DIR = ROOT / "blog"
POSTS_DIR = BLOG_DIR / "posts"
PROTECTED_DIR = ROOT / "research"
SITE_URL = "https://senyang-ml.github.io"


@dataclass(frozen=True)
class Post:
    source: Path
    title: str
    slug: str
    published: date
    description: str
    tags: Tuple[str, ...]
    draft: bool
    body: str
    body_html: str = ""

    @property
    def url(self) -> str:
        return f"/blog/posts/{self.slug}/"


def parse_scalar(value: str):
    value = value.strip()
    if not value:
        return ""
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    if value.startswith("[") and value.endswith("]"):
        return tuple(
            item.strip().strip("\"'")
            for item in value[1:-1].split(",")
            if item.strip()
        )
    return value.strip("\"'")


def split_front_matter(path: Path) -> Tuple[Dict[str, object], str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"{path.relative_to(ROOT)}: 缺少开头的 Markdown 元数据区块")
    try:
        end = next(i for i, line in enumerate(lines[1:], 1) if line.strip() == "---")
    except StopIteration as exc:
        raise ValueError(f"{path.relative_to(ROOT)}: 元数据区块没有结束标记 ---") from exc

    metadata: Dict[str, object] = {}
    list_key = None
    for raw_line in lines[1:end]:
        line = raw_line.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        if line.startswith(("  - ", "- ")) and list_key:
            current = list(metadata.get(list_key, ()))
            current.append(line.split("-", 1)[1].strip().strip("\"'"))
            metadata[list_key] = tuple(current)
            continue
        if ":" not in line:
            raise ValueError(f"{path.relative_to(ROOT)}: 无法解析元数据行 {line!r}")
        key, value = line.split(":", 1)
        list_key = key.strip()
        metadata[list_key] = parse_scalar(value)
    return metadata, "\n".join(lines[end + 1 :]).strip() + "\n"


def plain_description(body: str, limit: int = 150) -> str:
    text = re.sub(r"```.*?```", " ", body, flags=re.S)
    text = re.sub(r"!\[[^]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[#>*_`~|$-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def load_posts() -> Tuple[List[Post], List[Post]]:
    published_posts: List[Post] = []
    drafts: List[Post] = []
    slugs = set()
    for path in sorted(SOURCE_DIR.glob("*.md")):
        if path.name.lower() == "readme.md":
            continue
        metadata, body = split_front_matter(path)
        title = str(metadata.get("title", "")).strip()
        slug = str(metadata.get("slug", "")).strip()
        raw_date = str(metadata.get("date", "")).strip()
        if not title or not slug or not raw_date:
            raise ValueError(f"{path.relative_to(ROOT)}: title、slug 和 date 都是必填项")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            raise ValueError(f"{path.relative_to(ROOT)}: slug 只能包含小写字母、数字和连字符")
        if slug in slugs:
            raise ValueError(f"重复 slug: {slug}")
        slugs.add(slug)
        try:
            published = date.fromisoformat(raw_date)
        except ValueError as exc:
            raise ValueError(f"{path.relative_to(ROOT)}: date 必须使用 YYYY-MM-DD") from exc

        raw_tags = metadata.get("tags", ())
        tags = raw_tags if isinstance(raw_tags, tuple) else (str(raw_tags),) if raw_tags else ()
        post = Post(
            source=path,
            title=title,
            slug=slug,
            published=published,
            description=str(metadata.get("description", "")).strip() or plain_description(body),
            tags=tuple(tag for tag in tags if tag),
            draft=bool(metadata.get("draft", False)),
            body=body,
        )
        (drafts if post.draft else published_posts).append(post)
    published_posts.sort(key=lambda item: (item.published, item.slug), reverse=True)
    return published_posts, drafts


def render_markdown(post: Post) -> str:
    executable = shutil.which("pandoc")
    if not executable:
        raise RuntimeError("未找到 pandoc。macOS 可运行 `brew install pandoc` 后重试。")
    command = [
        executable,
        "--from=markdown+fenced_code_attributes+pipe_tables+task_lists+strikeout+tex_math_single_backslash",
        "--to=html5",
        "--wrap=none",
        "--mathjax",
    ]
    result = subprocess.run(command, input=post.body, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"Pandoc 转换失败：{post.source.name}\n{result.stderr.strip()}")
    return result.stdout.strip()


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def page_shell(*, title: str, description: str, canonical: str, body: str, article: bool) -> str:
    page_class = "article-page" if article else "index-page"
    page_type = "article" if article else "website"
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{esc(description)}">
  <meta name="generator" content="native-markdown-blog">
  <meta name="theme-color" content="#f3f0e8">
  <meta property="og:type" content="{page_type}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{esc(canonical)}">
  <link rel="canonical" href="{esc(canonical)}">
  <link rel="icon" type="image/png" href="/images/favicon-32x32-next.png">
  <link rel="stylesheet" href="/blog/assets/native.css">
  <title>{esc(title)}</title>
</head>
<body class="{page_class}">
  <div class="reading-progress" aria-hidden="true"></div>
  {body}
  <script src="/blog/assets/native.js" defer></script>
  <script>window.MathJax = {{tex: {{inlineMath: [['$', '$'], ['\\\\(', '\\\\)']]}}}};</script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" defer></script>
</body>
</html>
"""


def nav() -> str:
    return """<header class="site-header">
  <a class="wordmark" href="/blog/" aria-label="Sen Yang Notes 首页">SY<span>/</span>NOTES</a>
  <nav aria-label="主导航">
    <a href="/blog/">文章</a>
    <a href="/blog/legacy/">归档</a>
    <a href="/research/">Research</a>
  </nav>
</header>"""


def render_index(posts: Iterable[Post]) -> str:
    posts = list(posts)
    if posts:
        rows = "\n".join(
            f"""<article class="post-row reveal">
  <time datetime="{post.published.isoformat()}">{post.published.strftime('%Y.%m.%d')}</time>
  <div><h2><a href="{post.url}">{esc(post.title)}</a></h2><p>{esc(post.description)}</p>
    <div class="tags">{' '.join(f'<span>{esc(tag)}</span>' for tag in post.tags)}</div></div>
  <a class="row-arrow" href="{post.url}" aria-label="阅读 {esc(post.title)}">↗</a>
</article>""" for post in posts
        )
    else:
        rows = ""

    post_section = ""
    if posts:
        post_section = f"""<section class="post-list" id="notes">
    <div class="section-heading reveal"><p>Notes</p><h2>文章</h2><span>{len(posts):02d}</span></div>
    {rows}
  </section>"""

    body = f"""{nav()}
<main>
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Sen Yang</p>
      <h1>Notes on vision,<br>learning, and systems.</h1>
      <p class="lede">一些随意的个人记录与思考</p>
    </div>
    <p class="edition">01 / Notes</p>
  </section>
{post_section}
  <section class="legacy-band reveal">
    <div><p class="eyebrow">2018—2021</p><h2>Archive</h2></div>
    <a href="/blog/legacy/">浏览旧文章 <span>↗</span></a>
  </section>
</main>
<footer class="site-footer"><p>© {datetime.now().year} Sen Yang</p>
  <div><a href="/research/">Research</a><a href="https://github.com/senyang-ml">GitHub</a></div></footer>"""
    return page_shell(
        title="Sen Yang / Notes",
        description="Sen Yang 的研究与工程技术手记。",
        canonical=f"{SITE_URL}/blog/",
        body=body,
        article=False,
    )


def render_post(post: Post) -> str:
    tag_markup = " ".join(f"<span>{esc(tag)}</span>" for tag in post.tags)
    body = f"""{nav()}
<main class="article-main">
  <article>
    <header class="article-header reveal">
      <a class="back-link" href="/blog/">← 返回新文章</a>
      <p class="eyebrow">{post.published.strftime('%Y.%m.%d')}</p>
      <h1>{esc(post.title)}</h1>
      <p class="article-description">{esc(post.description)}</p><div class="tags">{tag_markup}</div>
    </header>
    <div class="article-body">{post.body_html}</div>
  </article>
  <aside class="article-end reveal"><p>End of note</p><a href="/blog/">继续阅读其他文章 →</a></aside>
</main>
<footer class="site-footer"><p>© {datetime.now().year} Sen Yang</p>
  <div><a href="/blog/legacy/">旧博客</a><a href="/research/">Research</a></div></footer>"""
    return page_shell(
        title=f"{post.title} · Sen Yang",
        description=post.description,
        canonical=f"{SITE_URL}{post.url}",
        body=body,
        article=True,
    )


def tree_digest(path: Path) -> str:
    digest = hashlib.sha256()
    for item in sorted(p for p in path.rglob("*") if p.is_file()):
        digest.update(str(item.relative_to(path)).encode())
        digest.update(item.read_bytes())
    return digest.hexdigest()


def copy_media() -> int:
    if not MEDIA_DIR.exists():
        return 0
    target = BLOG_DIR / "media"
    count = 0
    for source in sorted(p for p in MEDIA_DIR.rglob("*") if p.is_file()):
        destination = target / source.relative_to(MEDIA_DIR)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        count += 1
    return count


def prune_stale_posts(expected: set) -> Tuple[List[str], List[str]]:
    removed: List[str] = []
    unmanaged: List[str] = []
    for path in sorted(item for item in POSTS_DIR.iterdir() if item.is_dir()):
        if path.name in expected:
            continue
        index = path / "index.html"
        if index.is_file() and 'name="generator" content="native-markdown-blog"' in index.read_text(encoding="utf-8"):
            shutil.rmtree(path)
            removed.append(path.name)
        elif any(path.iterdir()):
            unmanaged.append(path.name)
    return removed, unmanaged


def build() -> None:
    before = tree_digest(PROTECTED_DIR)
    posts, drafts = load_posts()
    rendered = [replace(post, body_html=render_markdown(post)) for post in posts]
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    (BLOG_DIR / "index.html").write_text(render_index(rendered), encoding="utf-8")
    for post in rendered:
        output_dir = POSTS_DIR / post.slug
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "index.html").write_text(render_post(post), encoding="utf-8")
    media_count = copy_media()
    if before != tree_digest(PROTECTED_DIR):
        raise RuntimeError("安全检查失败：research/ 在构建期间发生了变化")

    removed, unmanaged = prune_stale_posts({post.slug for post in rendered})
    print(f"✅ 已生成 {len(rendered)} 篇文章，跳过 {len(drafts)} 篇草稿，复制 {media_count} 个媒体文件")
    print("✅ research/ 内容校验通过，旧博客目录未改写")
    if removed:
        print("✅ 已移除不再发布的生成目录：" + ", ".join(removed))
    if unmanaged:
        print("⚠️ 保留了非生成器管理的目录：" + ", ".join(unmanaged))


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or f"note-{datetime.now().strftime('%Y%m%d-%H%M%S')}"


def new_post(title: str, slug: Optional[str], publish_date: str) -> None:
    day = date.fromisoformat(publish_date)
    final_slug = slug or slugify(title)
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", final_slug):
        raise ValueError("slug 只能包含小写字母、数字和连字符")
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    path = SOURCE_DIR / f"{day.isoformat()}-{final_slug}.md"
    if path.exists():
        raise FileExistsError(f"文件已存在：{path.relative_to(ROOT)}")
    safe_title = title.replace('"', "'").replace("\n", " ")
    path.write_text(
        f'''---\ntitle: "{safe_title}"\nslug: {final_slug}\ndate: {day.isoformat()}\ndescription: ""\ntags: []\ndraft: true\n---\n\n从这里开始写正文。\n''',
        encoding="utf-8",
    )
    print(f"✅ 已创建 {path.relative_to(ROOT)}")
    print("编辑完成后把 draft 改为 false，再运行 build。")


def main() -> int:
    parser = argparse.ArgumentParser(description="Sen Yang 原生 Markdown 博客工具")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("build", help="把 Markdown 生成为静态 HTML")
    new_parser = subparsers.add_parser("new", help="创建一篇 Markdown 草稿")
    new_parser.add_argument("title", help="文章标题")
    new_parser.add_argument("--slug", help="文章 URL 名称，例如 my-first-post")
    new_parser.add_argument("--date", default=date.today().isoformat(), help="发布日期 YYYY-MM-DD")
    args = parser.parse_args()
    try:
        if args.command == "build":
            build()
        else:
            new_post(args.title, args.slug, args.date)
    except (FileExistsError, RuntimeError, ValueError) as exc:
        print(f"❌ {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
