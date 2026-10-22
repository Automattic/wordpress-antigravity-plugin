import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { root, sourceRoot, validateAntigravity } from './validate-antigravity.mjs';

const files = await validateAntigravity();
const manifest = JSON.parse(readFileSync(join(sourceRoot, 'plugin.json'), 'utf8'));
const packageName = manifest.name;
const dist = join(root, 'dist');
const staging = mkdtempSync(join(tmpdir(), 'antigravity-package-'));
const temporaryZip = join(dist, `.${packageName}.tmp.zip`);
const outputZip = join(dist, `${packageName}.zip`);

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, COPYFILE_DISABLE: '1' } });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed: ${result.error?.message ?? result.stderr}`);
  }
  return result.stdout;
}

try {
  mkdirSync(dist, { recursive: true });
  rmSync(temporaryZip, { force: true });
  for (const file of files) {
    const destination = join(staging, packageName, file);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(sourceRoot, file), destination);
  }
  const archivePaths = files.map((file) => `${packageName}/${file}`);
  run('zip', ['-X', '-q', temporaryZip, ...archivePaths], staging);
  assert.deepEqual(run('unzip', ['-Z1', temporaryZip]).trim().split('\n').sort(), [...archivePaths].sort());
  const extracted = join(staging, 'verify');
  run('unzip', ['-q', temporaryZip, '-d', extracted]);
  await validateAntigravity(join(extracted, packageName));
  renameSync(temporaryZip, outputZip);
  console.log(`Built ${outputZip} with ${files.length} files under ${packageName}/.`);
} finally {
  rmSync(temporaryZip, { force: true });
  rmSync(staging, { recursive: true, force: true });
}
