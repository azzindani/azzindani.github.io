---
title: "Publishing a Post"
description: "The manifest schema, the four post types, and what the editor does for you."
date: "2026-09-06"
category: "docs"
tags: ["docs"]
type: "doc"
collection: "site-guide"
order: 2
---

# Publishing a Post

Every post is one entry in `content/posts.json`, plus — depending on its type —
a markdown file, an upload, or nothing at all. The quickest route is the editor
at `#/admin`, which writes both back to the repository for you; editing the
manifest by hand works exactly the same way.

## The four types

`type` decides how the body is fetched and rendered:

- **`article`** — a markdown file in `content/posts/`, named by the `file` field.
- **`pdf`** — a PDF from `uploads/pdfs/`, shown as a paged carousel. It also
  accepts a single image (`.png`, `.jpg`, `.gif`, `.webp`, `.avif`, `.svg`),
  which renders as one page and is badged IMAGE rather than PDF.
- **`repo`** — a project page whose body is a README pulled live from GitHub,
  Hugging Face or GitLab. Relative image paths inside it are rewritten so they
  still resolve.
- **`doc`** — a page like this one. Docs live under `#/docs` with a sidebar and
  a table of contents, and never appear in a feed.

## Which tab it lands on

`kind` decides navigation, and it is separate from `type`. `"project"` puts a
post under **Projects**, `"blog"` under **Blog**. With no explicit `kind`, a
`repo` counts as a project and everything else as a blog post. Docs ignore
`kind` entirely.

## Fields worth knowing

| Field | Effect |
| ----- | ------ |
| `date` | Sort key. Feeds run newest first. |
| `featured` | Pins to the featured row at the top of a feed — three at most. |
| `collection` + `order` | Chains posts into a series at `#/collection/<slug>`. |
| `draft` | Hides it from every feed while leaving its URL reachable. |
| `tags`, `category` | Drive `#/tag/<slug>` and `#/category/<slug>`. |

## What markdown supports

GitHub-flavoured markdown — tables, task lists, strikethrough — plus
syntax-highlighted code, `$inline$` and `$$display$$` LaTeX, ` ```mermaid `
diagrams, and bare YouTube links on their own line turned into embeds.
Headings get anchors automatically, and any post with more than two of them
gets a table of contents.

Every one of those libraries is loaded from a CDN only when a page actually
needs it, so a post with no maths never pays for KaTeX.

## After editing by hand

The sitemap and the Atom feed are generated from the manifest, so regenerate
them whenever you change it:

```bash
node tools/build-content-files.js
```
