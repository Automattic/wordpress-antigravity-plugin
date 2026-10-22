import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const sourceRoot = join(root, 'wordpress');
const load = (path) => JSON.parse(readFileSync(path, 'utf8'));

export async function validateAntigravity(packageRoot = sourceRoot) {
  const manifestPath = join(packageRoot, 'plugin.json');
  assert(existsSync(manifestPath), 'plugin.json is required at the plugin root.');
  const manifest = load(manifestPath);

  // Fields the Antigravity CLI (agy plugin validate) recognizes. Anything else is reported as an unknown field and ignored.
  const knownFields = new Set(['$schema', 'name', 'displayName', 'version', 'description', 'logo', 'skills', 'suggestedPrompts', 'keywords', 'author', 'homepage', 'repository', 'license', 'disabled']);
  const unknownFields = Object.keys(manifest).filter((field) => !knownFields.has(field));
  assert.deepEqual(unknownFields, [], `plugin.json has fields the Antigravity CLI ignores: ${unknownFields.join(', ')}`);

  // 1.2 Required Core Fields
  assert.equal(typeof manifest.name, 'string', 'plugin.json name is required.');
  assert.match(manifest.name, /^[a-z0-9]+(-[a-z0-9]+)*$/, 'plugin.json name must be lowercase kebab-case.');
  assert(manifest.name.length >= 1 && manifest.name.length <= 64, 'plugin.json name must be 1-64 characters.');
  assert.equal(manifest.name, basename(packageRoot), 'plugin.json name must match the plugin directory name.');

  assert.equal(typeof manifest.description, 'string', 'plugin.json description is required.');
  assert(
    manifest.description.length >= 50 && manifest.description.length <= 200,
    'plugin.json description should be a concise 1-2 sentence summary (120-160 characters recommended).'
  );

  // 1.4 Marketplace & UI Presentation Fields
  assert.equal(typeof manifest.displayName, 'string', 'displayName is required for Marketplace.');
  assert(manifest.displayName.length > 0, 'displayName must not be empty.');
  assert(!/\b(Plugin|MCP)\b/i.test(manifest.displayName), 'displayName should omit redundant suffixes like "Plugin" or "MCP".');

  assert(Array.isArray(manifest.suggestedPrompts), 'suggestedPrompts is required for Marketplace.');
  assert(manifest.suggestedPrompts.length >= 1 && manifest.suggestedPrompts.length <= 3, 'suggestedPrompts must contain 1 to 3 starter prompts.');
  for (const prompt of manifest.suggestedPrompts) {
    assert(typeof prompt === 'string' && prompt.trim().length > 0, 'Each suggestedPrompt must be a non-empty string.');
  }

  // 1.5 Versioning & Attribution Metadata Fields
  assert.equal(typeof manifest.version, 'string', 'version is required for Marketplace.');
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/, 'version must follow Semantic Versioning (MAJOR.MINOR.PATCH).');

  assert(
    (typeof manifest.author === 'string' && manifest.author.trim().length > 0) ||
      (typeof manifest.author === 'object' && manifest.author !== null && typeof manifest.author.name === 'string' && manifest.author.name.trim().length > 0),
    'author is required for Marketplace.'
  );

  const safePath = (path) => {
    assert(typeof path === 'string' && !path.includes('\\') && !path.startsWith('/') && !path.split('/').includes('..'));
    return path.replace(/^\.\//, '');
  };

  // Validate README.md (Pre-install documentation rendered in Marketplace UI)
  const readmePath = join(packageRoot, 'README.md');
  assert(existsSync(readmePath) && statSync(readmePath).isFile(), 'README.md is required for Marketplace UI documentation.');
  assert(readFileSync(readmePath, 'utf8').trim().length > 0, 'README.md must not be empty.');

  // Validate logo (1:1 square image >= 128x128px with transparent padding)
  const logoRelPath = safePath(manifest.logo);
  const logoPath = join(packageRoot, logoRelPath);
  assert(existsSync(logoPath) && statSync(logoPath).isFile(), `Logo file missing: ${logoRelPath}`);
  const info = await sharp(logoPath).metadata();
  assert(info.format === 'png' || info.format === 'svg', 'Logo must be PNG or SVG.');
  assert(info.width >= 128 && info.height >= 128 && info.width === info.height, 'Logo must be a 1:1 square image (>= 128x128px).');
  assert(info.hasAlpha, 'Logo must have an alpha channel for transparent padding.');
  const pixels = await sharp(logoPath).ensureAlpha().raw().toBuffer();
  assert.equal(pixels[3], 0, 'Logo top-left corner must be transparent padding.');

  // Validate MCP server configuration. The CLI only reads the default mcp_config.json; it ignores a mcpServers path in plugin.json.
  const mcpRelPath = 'mcp_config.json';
  const mcpPath = join(packageRoot, mcpRelPath);
  assert(existsSync(mcpPath) && statSync(mcpPath).isFile(), `MCP config file missing: ${mcpRelPath}`);
  const mcpConfig = load(mcpPath);
  assert(typeof mcpConfig.mcpServers === 'object' && mcpConfig.mcpServers !== null, 'mcp_config.json must define mcpServers.');
  assert.equal(mcpConfig.mcpServers.mcp?.serverUrl, 'https://public-api.wordpress.com/wpcom/v2/mcp/v1');

  const expectedFiles = ['plugin.json', 'README.md', logoRelPath, mcpRelPath];

  // Validate skills (<skills-dir>/<skill-name>/SKILL.md)
  const skillDirs = manifest.skills ?? ['skills'];
  assert(Array.isArray(skillDirs) && skillDirs.length > 0, 'skills must be a non-empty array of relative paths.');
  let totalSkills = 0;
  for (const rawSkillDir of skillDirs) {
    const skillDirRel = safePath(rawSkillDir);
    const skillDirAbs = join(packageRoot, skillDirRel);
    assert(existsSync(skillDirAbs) && statSync(skillDirAbs).isDirectory(), `Skills directory missing: ${skillDirRel}`);
    const entries = readdirSync(skillDirAbs, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    for (const entry of entries) {
      totalSkills += 1;
      const skillRelPath = `${skillDirRel}/${entry.name}/SKILL.md`;
      const skillAbsPath = join(packageRoot, skillRelPath);
      assert(existsSync(skillAbsPath) && statSync(skillAbsPath).isFile(), `Missing ${skillRelPath}`);
      const text = readFileSync(skillAbsPath, 'utf8');
      const header = text.match(/^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n|$)/)?.[1];
      assert(header, `Skill frontmatter is missing in ${skillRelPath}`);
      const name = header.match(/^name: ([a-z0-9]+(?:-[a-z0-9]+)*)$/m)?.[1];
      assert.equal(name, entry.name, `Skill frontmatter name must match folder name in ${skillRelPath}`);
      const description = header.match(/^description: (.+)$/m)?.[1];
      assert(description && description.length >= 1 && description.length <= 1024, `Invalid skill description in ${skillRelPath}`);
      expectedFiles.push(skillRelPath);
    }
  }
  assert(totalSkills > 0, 'Plugin must bundle at least one skill.');

  const walk = (directory, prefix = '') =>
    readdirSync(directory).flatMap((name) => {
      const path = join(directory, name);
      return statSync(path).isDirectory() ? walk(path, `${prefix}${name}/`) : [`${prefix}${name}`];
    });
  assert.deepEqual(walk(packageRoot).sort(), [...expectedFiles].sort(), 'Unexpected or missing files in Antigravity plugin package.');
  return expectedFiles;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = await validateAntigravity();
  console.log(`Validated Antigravity plugin.json, mcp_config.json, README.md, logo, skills, and ${files.length} package files.`);
}
