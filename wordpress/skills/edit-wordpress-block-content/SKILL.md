---
name: edit-wordpress-block-content
description: Create and edit serialized WordPress block content for posts, pages, patterns, templates, and template parts. Use when a task creates, edits, or transforms content containing WordPress block markup.
---

# Edit WordPress Block Content

## Discover Site Context

- When a target site and the WordPress.com MCP server are available, call `wpcom-mcp-site-editor-context` to find out what block types are available before creating or editing content.
- When styling content, use the same tool to get the current theme presets and styles. Prefer returned theme tokens in supported block attributes over hard-coded values or custom style settings; use custom styles only when theme and block attributes cannot achieve the requested result.
- If the target site or WordPress.com MCP server is unavailable, limit new content to core blocks and custom blocks already present in the supplied content.

## Requirements

- You must keep content editable in the Block Editor or Site Editor which requires using only registered core blocks or existing plugin blocks.
- Do not add decorative HTML comments outside block delimiters.
- Preserve unfamiliar custom blocks, dynamic blocks, references, attributes, classes, and inner markup unless the request explicitly changes them.
- Keep block attributes and saved markup consistent. Do not invent media IDs, URLs, reusable-block references, or custom block attributes.
