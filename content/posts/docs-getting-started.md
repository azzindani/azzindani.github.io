---
title: "How This Site Works"
description: "The moving parts: a static SPA, one manifest, and no build step."
date: "2026-09-06"
category: "docs"
tags: ["docs"]
type: "doc"
collection: "site-guide"
order: 1
---

# How This Site Works

This site is a single HTML page served straight from a GitHub repository.
There is no build step, no framework and no bundler — the browser fetches
`index.html`, one stylesheet and two scripts, and everything else is data.

## The moving parts

| File | What it does |
| ---- | ------------ |
| `index.html` | The shell. Every route renders into `#app`. |
| `js/app.js` | Router, content service, page renderers, admin editor. |
| `js/neural-bg.js` | The animated neural mesh behind the page. |
| `content/posts.json` | The manifest — the single source of truth for what exists. |
| `content/posts/` | Markdown bodies, referenced by the manifest. |

## Routing

Routes are hash-based, so GitHub Pages needs no rewrite rules: `#/projects`,
`#/blog`, `#/post/<slug>`, `#/pdf/<slug>`, `#/collection/<slug>`, `#/tag/<slug>`,
`#/category/<slug>`, `#/docs` and `#/docs/<slug>`.

Anything after a second `#` is a heading anchor, so `#/post/a-post#results`
deep-links into a section.

## Where the content comes from

Nothing is generated at publish time. A post is one entry in the manifest;
its body is either a markdown file in the repo, a PDF or image in `uploads/`,
or a README fetched live from GitHub, Hugging Face or GitLab when the page
opens. Adding a post means adding a manifest entry — see the next page.

## The background

The mesh is decorative and drawn on a canvas. It follows scroll position on
the home page, splitting into figures and recombining between them, and it
respects `prefers-reduced-motion`. Every other page gets it as ambient drift.
