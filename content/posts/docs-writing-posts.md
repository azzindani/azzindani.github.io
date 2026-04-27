---
title: "Writing Posts"
description: "How to publish articles, PDFs, and repo READMEs."
date: "2024-04-25"
category: "docs"
tags: ["docs"]
type: "doc"
collection: "site-guide"
order: 2
---

# Writing Posts

Every post is one entry in `content/posts.json` plus (usually) one markdown
file in `content/posts/`. The fastest path is the admin editor at `#/admin`.

## Post types

- **`article`** — a regular markdown post.
- **`pdf`** — your PDF embedded in a carousel viewer. Upload the PDF
  directly from the editor, or drop it on `#/admin/upload` and copy
  the path.
- **`repo`** — pulls a README live from GitHub, Hugging Face, or GitLab.
  Relative image paths in the README are rewritten so they render correctly.
- **`doc`** — appears in the documentation sidebar instead of the feed.

## Featured & collections

- Tick **Featured** to pin a post to the top of the feed (max 3 visible).
- Set **Collection** + **Order** to chain related posts as a series. They
  show up at `#/collection/<name>`.

## Markdown features

Inline `$E = mc^2$` and display math, ` ```mermaid ` diagrams,
syntax-highlighted code, GFM tables, task lists, auto-linked YouTube
videos. See the [Markdown Showcase post](#/post/math-and-mermaid-showcase)
for a live demo.
