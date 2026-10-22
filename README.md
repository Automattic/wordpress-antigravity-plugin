# WordPress for Google Antigravity

The WordPress plugin for Google Antigravity connects to the public WordPress.com MCP server. It can build and publish sites, manage existing WordPress.com and Jetpack-connected sites, and includes three skills for block editing, publishing, and site management.

## Plugin layout

`wordpress/` is the installable plugin directory. Its name matches the `name` field in `wordpress/plugin.json`.

```text
wordpress/
├── plugin.json
├── README.md               # Marketplace pre-install page
├── assets/logo.png
├── mcp_config.json
└── skills/
    ├── edit-wordpress-block-content/
    ├── publish-wordpress-content/
    └── manage-wordpress-com-sites/
```

The MCP endpoint is `https://public-api.wordpress.com/wpcom/v2/mcp/v1`. Authentication uses OAuth discovery from the `serverUrl` in `mcp_config.json`; no credentials are stored in this repository. The `manage-wordpress-com-sites` skill keeps its service-specific name even though the plugin slug is `wordpress`.

## Build and validate

With Node.js 20+, pnpm, `zip`, and `unzip` installed:

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm test
pnpm build
agy plugin validate --strict ./wordpress
```

The build creates `dist/wordpress.zip` with a top-level `wordpress/` directory. `agy` is the [Antigravity CLI](https://antigravity.google/cli/install.sh) and is installed separately.

## Try it in Antigravity

1. Enable MCP access for at least one site in [WordPress.com account settings](https://my.wordpress.com/me/preferences/mcp).
2. In Antigravity, open **Customizations → Plugins → Install from URL** and enter the absolute path to this repository's `wordpress/` directory.
3. Confirm the installed plugin appears as **WordPress** with its logo and three starter prompts.
4. Start a conversation. The first WordPress.com tool call should open the WordPress.com authorization page. Sign in, choose an access level, and allow access.
5. Ask the plugin to review your site's traffic. Confirm it lists only sites your account can access and calls `statistics.get` for the selected site.

The plugin is licensed under GPL-2.0-or-later; see [LICENSE](LICENSE).
