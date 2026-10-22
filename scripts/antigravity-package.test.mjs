import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { sourceRoot, validateAntigravity } from './validate-antigravity.mjs';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));

async function fixture(run) {
  const base = mkdtempSync(join(tmpdir(), 'antigravity-package-test-'));
  const pkgDir = join(base, 'wordpress');
  try {
    cpSync(sourceRoot, pkgDir, { recursive: true });
    await run(pkgDir);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

test('Antigravity package validates with expected uploadable files', async () => {
  const files = await validateAntigravity();
  assert.deepEqual(files.sort(), [
    'README.md',
    'assets/logo.png',
    'mcp_config.json',
    'plugin.json',
    'skills/edit-wordpress-block-content/SKILL.md',
    'skills/manage-wordpress-com-sites/SKILL.md',
    'skills/publish-wordpress-content/SKILL.md',
  ]);
});

test('validator enforces Antigravity Marketplace manifest rules', async () => {
  for (const change of [
    (manifest) => { manifest.name = 'WordPress_Com'; },
    (manifest) => { manifest.displayName = 'WordPress.com Plugin'; },
    (manifest) => { manifest.suggestedPrompts = []; },
    (manifest) => { manifest.version = '1.0'; },
    (manifest) => { manifest.category = 'Developer Tools'; },
    (manifest) => { manifest.mcpServers = './mcp_config.json'; },
  ]) {
    await fixture(async (pkgDir) => {
      const manifest = read(join(pkgDir, 'plugin.json'));
      change(manifest);
      writeFileSync(join(pkgDir, 'plugin.json'), JSON.stringify(manifest, null, 2));
      await assert.rejects(validateAntigravity(pkgDir));
    });
  }
});

test('validator rejects non-padded opaque logo and unexpected files', async () => {
  await fixture(async (pkgDir) => {
    await sharp({ create: { width: 256, height: 256, channels: 4, background: '#3553EA' } })
      .png()
      .toFile(join(pkgDir, 'assets/logo.png'));
    await assert.rejects(validateAntigravity(pkgDir), /transparent padding/);
  });

  await fixture(async (pkgDir) => {
    writeFileSync(join(pkgDir, 'stray.txt'), 'stray');
    await assert.rejects(validateAntigravity(pkgDir), /Unexpected or missing files/);
  });
});
