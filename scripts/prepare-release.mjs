import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './validate-antigravity.mjs';

const version = process.argv[2];
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version ?? '') || process.argv.length !== 3) {
  console.error('Usage: pnpm release:prepare <major.minor.patch>');
  process.exit(1);
}

const path = join(root, 'wordpress', 'plugin.json');
const manifest = JSON.parse(readFileSync(path, 'utf8'));
if (manifest.version === version) {
  console.error(`Plugin version is already ${version}.`);
  process.exit(1);
}

manifest.version = version;
writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Set WordPress plugin version to ${version}. Run pnpm validate, pnpm test, and pnpm build before committing.`);
