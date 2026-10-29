#!/usr/bin/env node
/**
 * Usage (Node.js 18+):
 *   node fix-scroll-entrance.mjs [project-directory] [--dry-run]
 * Run against the actual Astro project, containing src/layouts/BaseLayout.astro
 * and src/styles/global.css. No packages or network access required.
 * Original bytes are backed up under .scroll-fix-backups/<timestamp>/.
 * Restore those two files from the backup to undo the patch.
 */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const marker = 'SCROLL_ENTRANCE_FIX_V1';
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node fix-scroll-entrance.mjs [project-directory] [--dry-run]');
  process.exit(0);
}
if (args.some(a => a.startsWith('--') && a !== '--dry-run') || args.filter(a => a !== '--dry-run').length > 1) {
  console.error('Usage: node fix-scroll-entrance.mjs [project-directory] [--dry-run]');
  process.exit(1);
}
const root = path.resolve(args.find(a => a !== '--dry-run') || '.');
const dryRun = args.includes('--dry-run');

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one original block, found ${count}. No files changed.`);
  return source.replace(before, after);
}

function patchLayout(source) {
  let out = replaceOnce(source,
`    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(scheduleMeasurement)
      : null;`,
`    // ${marker}: synchronize clipping and roller position before paint.
    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(function () {
          if (disposed) return;
          window.cancelAnimationFrame(measurementId);
          measurementId = 0;
          measure(false);
        })
      : null;`, 'ResizeObserver');
  out = replaceOnce(out,
`  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, {
      once: true,
      signal: lifetime.signal,
    });
  } else {
    initialize();
  }`,
`  // The inline script follows the stage markup: close it before first paint.
  initialize();`, 'initialization');
  return out;
}

function patchCss(source) {
  // Target only Step 17's outer stage; retain JS control of unfurling and roller.
  return replaceOnce(source,
`  body > .scroll-stage {
    animation: none !important;
    transform: none !important;
    opacity: 1 !important;
    min-height: 100vh !important;`,
`  /* ${marker}: the stage fades while JS controls unfurling. */
  body > .scroll-stage {
    animation: stageFadeIn var(--fade-duration, 0.8s) ease-out both;
    transform: translateY(0);
    min-height: 100vh !important;`, 'mobile stage CSS');
}

async function main() {
  const specs = [
    ['src/layouts/BaseLayout.astro', patchLayout],
    ['src/styles/global.css', patchCss],
  ];
  // Read and validate both files before creating backups or modifying either.
  const files = [];
  for (const [relative, patch] of specs) {
    const filename = path.join(root, relative);
    const original = await readFile(filename);
    const source = original.toString('utf8');
    const normalized = source.replace(/\r\n/g, '\n');
    files.push({ relative, filename, original, normalized, patch });
  }
  const marked = files.filter(f => f.normalized.includes(marker));
  if (marked.length === files.length) {
    console.log('Fix already applied; no files changed.');
    return;
  }
  if (marked.length) throw new Error('Only one file has the patch marker. Restore the pair from backup before retrying. No files changed.');
  for (const f of files) {
    const patched = f.patch(f.normalized);
    // Preserve each original file's newline convention.
    f.output = Buffer.from(f.original.includes(Buffer.from('\r\n')) ? patched.replace(/\n/g, '\r\n') : patched);
  }
  if (dryRun) {
    console.log(`Validated patch in ${root}. Would update:\n${files.map(f => '  ' + f.relative).join('\n')}\nNo files changed.`);
    return;
  }
  const backup = path.join(root, '.scroll-fix-backups', new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid);
  await mkdir(backup, { recursive: true });
  for (const f of files) {
    const destination = path.join(backup, f.relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, f.original, { flag: 'wx' });
  }
  const attempted = [];
  try {
    for (const f of files) {
      // Avoid overwriting changes made after validation.
      if (!(await readFile(f.filename)).equals(f.original)) throw new Error(`${f.relative} changed during patching.`);
      attempted.push(f);
      await writeFile(f.filename, f.output);
    }
  } catch (error) {
    for (const f of attempted.reverse()) {
      try { await copyFile(path.join(backup, f.relative), f.filename); }
      catch (restoreError) { console.error(`Restore failed for ${f.relative}: ${restoreError.message}`); }
    }
    throw new Error(`${error.message}\nPatch failed; restoration attempted. Backups: ${backup}`);
  }
  console.log(`Updated both files. Backups: ${backup}\nNext: run your usual build, then check a fresh mobile reload and roller dragging.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });