这个目录用于存放新文章的 Markdown 源稿。请使用：

```bash
python3 scripts/blog.py new "文章标题" --slug article-slug
```

文件名为 `YYYY-MM-DD-slug.md`；只有 `draft: false` 的文章会被发布。
