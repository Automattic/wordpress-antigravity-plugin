---
name: publish-wordpress-content
description: Draft, edit, schedule, and manage posts, pages, custom post types, media, comments, taxonomies, templates, and navigation on WordPress.com sites. Use when creating or updating site content or site structure.
---

# Publish WordPress Content

## 1. Resolve Target Site & Editor Context

1. Identify the target site (`wpcom_site`). If unknown, call `wpcom-user-sites` to list the user's accessible sites.
2. Before creating or editing block content, call `wpcom-mcp-site-editor-context` (`action: "get"`) to inspect:
   - `blocks.allowed`: Registered block types available on the site.
   - `theme.presets` and `theme.styles`: Active theme color palette, typography, and spacing presets.
3. Follow the `edit-wordpress-block-content` skill rules so all generated markup remains valid, editable Gutenberg block markup using registered blocks and theme tokens.

## 2. Content Authoring (`wpcom-mcp-content-authoring`)

Use `wpcom-mcp-content-authoring` with `wpcom_site` and the `list` -> `describe` -> `execute` workflow:

- **Posts & Pages (`posts.*`, `pages.*`)**:
  - Read existing items with `posts.list`, `posts.get`, `pages.list`, or `pages.get`.
  - Prefer creating new posts and pages as drafts (`status: "draft"`) unless the user explicitly asks to publish or schedule them.
  - Never report a draft as published; always report its actual returned status, ID, and URL.
- **In-Place Section Editing (`page-sections.*`, `post-sections.*`)**:
  - When updating a specific section, CTA button, heading, or block within an existing page or post, prefer `page-sections.*` or `post-sections.*` (`list` to inspect, then `replace`, `insert`, `move`, or `remove`) to change only the target top-level block in place rather than rewriting the entire post or page.
- **Custom Post Types (`content-types.*`, `content-items.*`, `content-terms.*`)**:
  - Discover custom post types (such as WooCommerce products or portfolio projects) with `content-types.list`, and manage their items and taxonomies with `content-items.*` and `content-terms.*`.
- **Media, Comments, Taxonomies & Patterns**:
  - Manage categories, tags, media library items, and comment moderation through their respective `wpcom-mcp-content-authoring` operations.

## 3. Site Structure & Navigation (`wpcom-mcp-site-editing`)

Use `wpcom-mcp-site-editing` with `wpcom_site` to inspect and update site-wide design and structure:

- **Templates & Template Parts**: `templates.*` and `template-parts.*`
- **Navigation Menus**: `navigation.*` (classic and block navigation menus)
- **Global Styles & Themes**: `global-styles.*` and `themes.*`

Because site-editing write operations affect all visitors site-wide, always summarize the proposed structural change and ask for explicit confirmation before executing.

## 4. Confirmation & Safety Policy

- Every create, update, or delete operation in `wpcom-mcp-content-authoring` and `wpcom-mcp-site-editing` requires explicit user confirmation before execution.
- Present a concise summary of what will be created, modified, or deleted, wait for the user's approval, and pass `user_confirmed: true` in `params` when calling `action: "execute"`.
