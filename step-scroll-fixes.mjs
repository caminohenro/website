#!/usr/bin/env node
// Node.js 18+
// Usage: node fix-forum-roller.mjs [project-directory] [--dry-run]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Script } from 'node:vm';

function replacementCode() {
    // FORUM_ROLLER_SYNC_V1
    let forumMutationDepth = 0;

    function animateForumRegion(region, mutate, close = false) {
      if (!region || forumMutationDepth) {
        mutate();
        return;
      }

      const ancestor = [...sharedAnimations.keys()].find(
        element => element !== region && element.contains(region)
      );

      if (ancestor) {
        // Sample the ancestor before changing its contents.
        animateForumRegion(ancestor, mutate);
        return;
      }

      const previous = sharedAnimations.get(region);
      const oldHeight = region.getBoundingClientRect().height;
      const descendants = [...sharedAnimations.entries()].filter(
        ([element]) => element !== region && region.contains(element)
      );

      // Release child viewport trackers at their current heights.
      // The outer tracker then owns the remaining transition.
      descendants.forEach(([, state]) => state.finishViewport());

      const state = previous || {
        finishViewport: trackViewportRegion(region),
        height: region.style.height,
        overflow: region.style.overflow,
        animations: []
      };

      // Settle existing child animations before measuring the destination.
      descendants.forEach(([element, childState]) => {
        childState.token = null;
        childState.animations.forEach(animation => animation.cancel());
        element.style.height = childState.height;
        element.style.overflow = childState.overflow;
        sharedAnimations.delete(element);
      });

      // Invalidate callbacks belonging to an interrupted animation.
      state.token = {};
      const token = state.token;

      state.animations.forEach(animation => animation.cancel());
      state.animations = [];

      // Register before mutate(), which may call renderThreadList()
      // or renderRepliesList() and re-enter this function.
      sharedAnimations.set(region, state);

      const restore = () => {
        region.style.height = state.height;
        region.style.overflow = state.overflow;
        state.animations.forEach(animation => animation.cancel());
        state.finishViewport();
        sharedAnimations.delete(region);
      };

      try {
        region.style.height = state.height;
        region.style.overflow = state.overflow;

        if (!close) {
          forumMutationDepth++;
          try {
            mutate();
          } finally {
            forumMutationDepth--;
          }
        }

        // Nested render calls have completed synchronously, so this is
        // the natural destination height, not a child's animation frame.
        const targetHeight = close
          ? 0
          : region.getBoundingClientRect().height;

        const shrinking = targetHeight < oldHeight;
        const duration = shrinking
          ? composerInlineCloseDuration
          : composerInlineOpenDuration;

        region.style.height = `${oldHeight}px`;
        region.style.overflow = 'hidden';

        state.animations.push(region.animate(
          [
            { height: `${oldHeight}px` },
            { height: `${targetHeight}px` }
          ],
          {
            duration,
            easing: shrinking
              ? 'cubic-bezier(0.4, 0, 0.8, 0.2)'
              : 'cubic-bezier(0.33, 1, 0.62, 1)',
            fill: 'both'
          }
        ));

        for (const child of region.children) {
          state.animations.push(child.animate(
            close
              ? [
                  { opacity: 1, transform: 'translateY(0)' },
                  { opacity: 0, transform: 'translateY(-12px)' }
                ]
              : [
                  { opacity: 0, transform: 'translateY(-14px)' },
                  { opacity: 1, transform: 'translateY(0)' }
                ],
            {
              duration: close
                ? Math.max(1, duration - 80)
                : composerContentFadeDuration,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'both'
            }
          ));
        }

        Promise.all(
          state.animations.map(animation =>
            animation.finished.catch(() => {})
          )
        ).then(() => {
          if (
            state.token !== token ||
            sharedAnimations.get(region) !== state
          ) return;

          try {
            if (close) {
              forumMutationDepth++;
              try {
                mutate();
              } finally {
                forumMutationDepth--;
              }
            }
          } finally {
            restore();
          }
        });
      } catch (error) {
        state.token = null;
        restore();
        throw error;
      }
    }
}

const args = process.argv.slice(2);
const positional = args.filter(argument => argument !== '--dry-run');

if (
  positional.length > 1 ||
  args.some(argument =>
    argument.startsWith('--') && argument !== '--dry-run'
  )
) {
  console.error(
    'Usage: node fix-forum-roller.mjs [project-directory] [--dry-run]'
  );
  process.exit(1);
}

const root = path.resolve(positional[0] || '.');
const filename = path.join(root, 'src/pages/forum.astro');
const dryRun = args.includes('--dry-run');

async function main() {
  const original = await readFile(filename);
  let source = original.toString('utf8').replace(/\r\n?/g, '\n');

  if (source.includes('FORUM_ROLLER_SYNC_V1')) {
    console.log('Roller fix already applied. No changes.');
    return;
  }

  for (const marker of [
    'FORUM_VIEWPORT_FIX_V1',
    'FORUM_SHARED_UNFURL_V1'
  ]) {
    if (!source.includes(marker)) {
      throw new Error(
        `Required previous patch missing: ${marker}. No files changed.`
      );
    }
  }

  const startMarker = '    function animateForumRegion(';
  const endMarker = '    function animateMainViewChange(';

  function uniqueIndex(marker) {
    const index = source.indexOf(marker);
    if (
      index < 0 ||
      source.indexOf(marker, index + marker.length) !== -1
    ) {
      throw new Error(
        `Expected one occurrence of ${marker.trim()}. No files changed.`
      );
    }
    return index;
  }

  const start = uniqueIndex(startMarker);
  const end = uniqueIndex(endMarker);

  if (end <= start) {
    throw new Error('Unexpected animation section. No files changed.');
  }

  const existing = source.slice(start, end);

  for (const expected of [
    'mutate();',
    'animateForumRegion(ancestor, () => {});',
    'finishViewport: trackViewportRegion(region)',
    'const targetHeight = close',
    'sharedAnimations.set(region, state);'
  ]) {
    if (!existing.includes(expected)) {
      throw new Error(
        'Animation helper differs from the supplied version. ' +
        'No files changed.'
      );
    }
  }

  const functionSource = replacementCode.toString();
  const replacement = functionSource.slice(
    functionSource.indexOf('{') + 1,
    functionSource.lastIndexOf('}')
  );

  source =
    source.slice(0, start) +
    replacement +
    '\n\n' +
    source.slice(end);

  // Validate every inline script before writing.
  let scriptCount = 0;
  for (const match of source.matchAll(
    /<script\b[^>]*>([\s\S]*?)<\/script>/g
  )) {
    new Script(match[1], {
      filename: `forum-inline-${++scriptCount}.js`
    });
  }

  if (!scriptCount) {
    throw new Error('No inline scripts found. No files changed.');
  }

  if (dryRun) {
    console.log(
      'Patch and inline JavaScript syntax validated.\nWould update: ' +
      filename +
      '\nNo files changed.'
    );
    return;
  }

  const backupDirectory = path.join(
    root,
    '.scroll-fix-backups',
    'forum-roller-' +
      new Date().toISOString().replace(/[:.]/g, '-') +
      '-' + process.pid
  );

  await mkdir(backupDirectory, { recursive: true });

  const backupFile = path.join(backupDirectory, 'forum.astro');
  await writeFile(backupFile, original, { flag: 'wx' });

  if (!(await readFile(filename)).equals(original)) {
    throw new Error(
      'forum.astro changed during patching. No changes applied.'
    );
  }

  // Preserve the original newline convention.
  if (original.includes(Buffer.from('\r\n'))) {
    source = source.replace(/\n/g, '\r\n');
  }

  try {
    await writeFile(filename, source);
  } catch (error) {
    try {
      await writeFile(filename, original);
    } catch (restoreError) {
      throw new Error(
        `Write failed: ${error.message}\n` +
        `Automatic restoration failed: ${restoreError.message}\n` +
        `Restore the original from: ${backupFile}`
      );
    }
    throw new Error(
      `Write failed; original restored: ${error.message}`
    );
  }

  console.log(
    'Updated: ' + filename +
    '\nOriginal backup: ' + backupFile
  );
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});