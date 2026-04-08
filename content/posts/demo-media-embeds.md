---
title: "Media Embeds Demo"
description: "Showcasing YouTube videos, audio players, and GIF support built into the feed."
date: "2024-03-15"
category: "demo"
tags: ["media", "youtube", "demo"]
type: "article"
---

# Media Embeds

This site supports rich media embeds directly in your posts and in the feed.

## YouTube Videos

Simply paste a YouTube URL on its own line and it will auto-embed:

https://www.youtube.com/watch?v=dQw4w9WgXcQ

## Audio

You can embed audio files using standard HTML in your markdown:

<audio controls preload="metadata" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>

## GIFs

GIFs render inline and autoplay as expected. Use standard markdown image syntax:

![Demo GIF](https://media.giphy.com/media/ZVik7pBtu9dNS/giphy.gif)

## How It Works

The feed automatically detects media types from the post manifest and renders the appropriate player inline. YouTube URLs in markdown content are also auto-detected and converted to embedded players.
