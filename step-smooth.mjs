#!/usr/bin/env node
// Node.js 18+
// Usage: node smooth-mobile-unfurl.mjs [project-directory] [--dry-run]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const marker = 'MOBILE_SMOOTH_UNFURL_V1';
const args = process.argv.slice(2);
const positional = args.filter(a => a !== '--dry-run');

if (
  positional.length > 1 ||
  args.some(a => a.startsWith('--') && a !== '--dry-run')
) {
  console.error(
    'Usage: node smooth-mobile-unfurl.mjs [project-directory] [--dry-run]'
  );
  process.exit(1);
}

function once(source, before, after) {
  if (source.split(before).length !== 2) {
    throw new Error(
      'Expected unique source missing: ' + before.slice(0, 100)
    );
  }
  return source.replace(before, () => after);
}

function replaceSection(source, startText, endText, replacement) {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start + startText.length);

  if (
    start < 0 || end <= start ||
    source.indexOf(startText, start + startText.length) !== -1
  ) {
    throw new Error('Expected section missing or ambiguous: ' + startText);
  }

  return source.slice(0, start) + replacement + '\n\n' + source.slice(end);
}

// Inserted into the existing mobile physics function.
function releaseCode() {
    // MOBILE_SMOOTH_UNFURL_V1
    function mobileOpeningSettings() {
      const styles = window.getComputedStyle(paper);

      function number(name, fallback) {
        const value = Number.parseFloat(styles.getPropertyValue(name));
        return Number.isFinite(value) && value > 0 ? value : fallback;
      }

      return {
        speed: number('--mobile-unfurl-speed', 900) / 1000,
        threshold: number('--mobile-release-threshold', 350) / 1000,
        releaseCap: number('--mobile-release-speed-cap', 900) / 1000,
        minimum: number('--mobile-unfurl-min-duration', 1200),
      };
    }

    function mobileOpeningDuration(distance, settings) {
      return Math.max(settings.minimum, distance / settings.speed);
    }

    function beginOriginalOpening(releaseSpeed) {
      const remaining = Math.max(0, height - revealed);
      const settings = mobileOpeningSettings();

      if (
        reducedMotion.matches ||
        remaining <= 0 ||
        releaseSpeed < settings.threshold
      ) return false;

      const duration = mobileOpeningDuration(remaining, settings);
      const initialSpeed = Math.min(releaseSpeed, settings.releaseCap);

      // Set the curve's initial slope from the release speed.
      // Restrict its control point to keep progress monotonic.
      const firstY = clamp(
        initialSpeed * duration / remaining * 0.33,
        0,
        1
      );

      opening = {
        followHeight: true,
        startedAt: performance.now(),
        start: revealed,
        remaining,
        duration,
        points: [0.33, firstY, 0.67, 1],
      };

      velocity = 0;
      beginFrame();
      return true;
    }
}

function automaticCode() {
    function beginAutomaticOpening() {
      if (startsClosed) return;
      dismissHint();

      if (reducedMotion.matches) {
        revealed = height;
        render();
        return;
      }

      // Preserve the existing delay, including CSS calc() values.
      const styles = window.getComputedStyle(paper);
      const probe = document.createElement('div');

      probe.style.cssText =
        'position:fixed;visibility:hidden;pointer-events:none;' +
        'width:0;height:0;padding:0;border:0;margin:0;';

      probe.style.transitionDelay =
        styles.getPropertyValue('--unfurl-delay').trim() || '0.9s';

      paper.appendChild(probe);

      const delayText = window.getComputedStyle(probe).transitionDelay;
      const delay = parseFloat(delayText) *
        (delayText.endsWith('ms') ? 1 : 1000);

      probe.remove();

      const settings = mobileOpeningSettings();

      opening = {
        automatic: true,
        followHeight: true,
        startedAt: performance.now() +
          (Number.isFinite(delay) ? Math.max(0, delay) : 900),
        start: 0,
        remaining: height,
        duration: mobileOpeningDuration(height, settings),
        // Gradual acceleration and deceleration; zero initial speed.
        points: [0.42, 0, 0.58, 1],
      };

      velocity = 0;
      beginFrame();
    }
}

function functionBody(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf('{') + 1, source.lastIndexOf('}'));
}

const css = `
/* MOBILE_SMOOTH_UNFURL_V1 */
@media (max-width: 680px) {
  :root {
    /* Average opening speed in pixels per second. Lower = slower. */
    --mobile-unfurl-speed: 900;

    /* Downward release speed needed for full opening, in px/second. */
    --mobile-release-threshold: 350;

    /* Maximum initial completion speed after releasing, in px/second. */
    --mobile-release-speed-cap: 900;

    /* Minimum opening/completion duration, in milliseconds. */
    --mobile-unfurl-min-duration: 1200;
  }
}
`;

async function main() {
  const root = path.resolve(positional[0] || '.');
  const files = [];

  for (const relative of [
    'src/layouts/BaseLayout.astro',
    'src/styles/global.css'
  ]) {
    const filename = path.join(root, relative);
    const original = await readFile(filename);

    files.push({
      relative,
      filename,
      original,
      source: original.toString('utf8').replace(/\r\n?/g, '\n')
    });
  }

  const marked = files.filter(f => f.source.includes(marker)).length;

  if (marked === 2) {
    console.log('Already patched. No changes.');
    return;
  }
  if (marked) {
    throw new Error('Only one file is patched. Restore both from backup first.');
  }

  let layout = files[0].source;

  if (!layout.includes('ALL_PAGES_MOBILE_DRAG_V1')) {
    throw new Error('Expected all-pages mobile physics patch missing.');
  }

  layout = replaceSection(
    layout,
    '    function beginOriginalOpening(releaseSpeed) {',
    '    function tick(now) {',
    functionBody(releaseCode)
  );

  layout = replaceSection(
    layout,
    '    function beginAutomaticOpening() {',
    '    measure(true);',
    functionBody(automaticCode)
  );

  // Content changes must not cancel the new completion animation.
  layout = once(
    layout,
    'if (opening && !opening.automatic && Math.abs(previousHeight - height) > 0.5)',
    'if (opening && !opening.automatic && !opening.followHeight && Math.abs(previousHeight - height) > 0.5)'
  );

  // Follow the actual paper endpoint if dynamic content changes its height.
  layout = once(
    layout,
    'revealed = clamp(opening.start + opening.remaining *',
    'revealed = clamp(opening.start + ' +
      '(opening.followHeight ? Math.max(0, height - opening.start) : opening.remaining) *'
  );

  files[0].output = layout;
  files[1].output = files[1].source + '\n' + css;

  if (args.includes('--dry-run')) {
    console.log(
      'Source matches the expected patch targets.\n' +
      'Would update BaseLayout.astro and global.css. No files changed.'
    );
    return;
  }

  const backup = path.join(
    root,
    '.scroll-fix-backups',
    'smooth-mobile-' + Date.now() + '-' + process.pid
  );

  for (const f of files) {
    const destination = path.join(backup, f.relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, f.original, { flag: 'wx' });
  }

  const attempted = [];

  try {
    for (const f of files) {
      if (!(await readFile(f.filename)).equals(f.original)) {
        throw new Error(f.relative + ' changed during patching.');
      }

      attempted.push(f);

      await writeFile(
        f.filename,
        f.original.includes(Buffer.from('\r\n'))
          ? f.output.replace(/\n/g, '\r\n')
          : f.output
      );
    }
  } catch (error) {
    for (const f of attempted.reverse()) {
      try {
        await writeFile(f.filename, f.original);
      } catch (restoreError) {
        console.error(
          'Restore failed: ' + f.filename + ': ' + restoreError.message
        );
      }
    }
    throw new Error(
      error.message + '\nRestoration attempted. Backups: ' + backup
    );
  }

  console.log('Updated both files. Backups: ' + backup);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});