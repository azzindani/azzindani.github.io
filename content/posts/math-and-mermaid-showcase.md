---
title: "Markdown Showcase: Math, Mermaid, Code"
description: "A showcase post demonstrating LaTeX math, Mermaid diagrams, syntax-highlighted code, tables, and more."
date: "2024-04-20"
category: "demo"
tags: ["latex", "mermaid", "showcase"]
type: "article"
---

## LaTeX inline math

Energy and mass relate via Einstein's classic $E = mc^2$. The probability
density of a normal distribution: $f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}(\frac{x-\mu}{\sigma})^2}$.

## Display math

The cross-entropy loss for a classifier with $K$ classes:

$$
\mathcal{L} = -\sum_{i=1}^{N} \sum_{k=1}^{K} y_{i,k} \log \hat{y}_{i,k}
$$

A matrix multiplication identity:

$$
(AB)^\top = B^\top A^\top
$$

## Mermaid diagram

```mermaid
graph LR
    Input --> Encode[Tokenize & Embed]
    Encode --> Attention[Self-attention]
    Attention --> FFN[Feed-forward]
    FFN --> Output[Logits]
```

## Code block with highlighting

```python
import torch
import torch.nn.functional as F

def softmax_cross_entropy(logits, labels):
    return F.cross_entropy(logits, labels)
```

## Table

| Component | Purpose                       |
| --------- | ----------------------------- |
| Embedding | Map tokens to vectors         |
| Attention | Mix token representations     |
| FFN       | Per-token non-linear transform |
