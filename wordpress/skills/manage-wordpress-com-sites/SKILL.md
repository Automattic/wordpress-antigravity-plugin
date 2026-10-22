---
name: manage-wordpress-com-sites
description: Discover, provision, and administer WordPress.com and Jetpack-connected sites. Use when listing sites, creating a new site, checking traffic statistics, updating site settings, managing plugins or users, or configuring domains and DNS.
---

# Manage WordPress.com Sites

## 1. Site Discovery

- Call `wpcom-user-sites` first when the target site URL or blog ID is not yet resolved, or when the user asks which sites they can manage.
- Report only the sites returned for the authenticated account with their returned names, URLs (`primary_domain` or `site_url`), platform (`simple`, `atomic`, `jetpack`), and `mcp_access` status. Never invent sites or imply access to sites absent from the response.
- If a site reports `mcp_access.status` as `unavailable` or `limited`, relay `mcp_access.message` and `mcp_access.activation_steps` (or `upgrade_url`) to the user.

## 2. Progressive Operation Discovery (`list` -> `describe` -> `execute`)

Multi-operation WordPress.com MCP tools (`wpcom-mcp-site`, `wpcom-mcp-create-site`, `wpcom-mcp-plugin-management`, `wpcom-mcp-user-management`, `wpcom-mcp-account`) use a 3-step action pattern:

1. **`list`**: Call with `action: "list"` to discover available operations if you are unsure which operation name applies.
2. **`describe`**: Call with `action: "describe"` and `operation: "<resource.action>"` to inspect the required parameter schema before executing.
3. **`execute`**: Call with `action: "execute"`, `operation: "<resource.action>"`, top-level `wpcom_site` (for site-scoped tools), and `params`.

## 3. Creating a New Site (`wpcom-mcp-create-site`)

1. Call `wpcom-mcp-create-site` with `action: "execute"` and `operation: "site.instructions"` to load the site creation runbook and verify preflight status.
2. Derive a candidate subdomain slug from the requested site title according to the runbook and check availability using `operation: "subdomain.check"`.
3. Present the proposed title and returned `would_be_url` to the user and wait for explicit approval.
4. Only after the user confirms, call `operation: "site.provision"` with the confirmed `title`, optional `description`, and `user_confirmed: true`.

## 4. Traffic Statistics & Site Settings (`wpcom-mcp-site`)

- **Traffic & Analytics**: Use `operation: "statistics.get"` on `wpcom-mcp-site` with `wpcom_site` set to the target site. When comparing periods (e.g., this month vs. last month), label the current calendar month as month-to-date, report exact tool-returned views and visitors, and guard against division by zero when calculating percentage changes.
- **Settings & Themes**: Use `settings.get` / `settings.update` for site title, tagline, and general options, and `theme.list` / `theme.set` for theme management. Always show the current and proposed values and obtain explicit user confirmation before calling write operations with `user_confirmed: true`.

## 5. Plugins, Collaborators & Domains

- **Plugins (`wpcom-mcp-plugin-management`)**: Use `plugin.search` (account-level) or site-scoped `plugin.list`, `plugin.install`, `plugin.activate`, `plugin.deactivate`, `plugin.update`, and `plugin.uninstall`. Request explicit user approval before any write operation.
- **Collaborators (`wpcom-mcp-user-management`)**: Use `user.list` and `user.pending-invites` to inspect access, and `user.invite`, `user.change-role`, `user.cancel-invite`, `user.resend-invite`, or `user.remove-access` with `user_confirmed: true` after user approval. Only stock WordPress roles (`administrator`, `editor`, `author`, `contributor`, `subscriber`) are supported.
- **Domains, DNS & Plans**:
  - Use `wpcom-domain-purchase` to check domain availability and pricing, and `wpcom-plans-list` / `wpcom-checkout-url` to inspect plans or generate checkout links. Purchases are completed by the user in their browser via the returned `checkout_url`.
  - Use `wpcom-domain-update-dns-records`, `wpcom-domain-restore-default-dns-records`, `wpcom-domain-update-nameservers`, and `wpcom-domain-set-mail-service` only after confirming the proposed DNS changes with the user.

## 6. Platform Boundaries

- Hosted WordPress.com MCP tools do not provide direct server-filesystem editing (such as editing `wp-config.php`) or raw SQL query execution (`SELECT * FROM wp_options`). Explain these boundaries clearly without invoking unrelated tools or fabricating results.
