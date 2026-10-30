#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const marker = 'SHARED_SCROLL_MOTION_V1';
const args = process.argv.slice(2);
const positional = args.filter(arg => arg !== '--dry-run');

if (
  positional.length > 1 ||
  args.some(arg => arg.startsWith('--') && arg !== '--dry-run')
) {
  console.error(
    'Usage: node unify-scroll-motion.mjs [project-directory] [--dry-run]'
  );
  process.exit(1);
}

const root = path.resolve(positional[0] || '.');

function replaceOne(text, pattern, replacement, label) {
  const count = typeof pattern === 'string'
    ? text.split(pattern).length - 1
    : [...text.matchAll(pattern)].length;

  if (count !== 1) {
    throw new Error(
      `${label}: expected one match, found ${count}. No files changed.`
    );
  }

  return text.replace(pattern, replacement);
}

function editSection(text, startText, endText, edit) {
  const start = text.indexOf(startText);
  const end = text.indexOf(endText, start);

  if (start < 0 || end <= start) {
    throw new Error(
      'Expected desktop controller section not found. No files changed.'
    );
  }

  return (
    text.slice(0, start) +
    edit(text.slice(start, end)) +
    text.slice(end)
  );
}

// This function is inserted as an inline browser script.
function sharedScrollHelpers() {
  const pendingUnfurls = new WeakMap();

  window.scrollMovePosition = function (stage, targetY, from) {
    const styles = window.getComputedStyle(stage);
    const durationText = styles
      .getPropertyValue('--scroll-move-duration')
      .trim();

    const match = durationText.match(/^([\d.]+)(ms|s)$/i);

    const duration = match
      ? Number(match[1]) *
        (match[2].toLowerCase() === 's' ? 1000 : 1)
      : 1000;

    const easing =
      styles.getPropertyValue('--scroll-move-easing').trim() ||
      'cubic-bezier(0.25, 0.1, 0.25, 1)';

    const origin = from || styles.translate;

    return stage.animate(
      [
        { translate: origin === 'none' ? '0px 0px' : origin },
        { translate: '0px ' + targetY + 'px' }
      ],
      { duration, easing, fill: 'both' }
    );
  };

  window.prepareScrollUnfurl = function (paper) {
    // Remove an unfinished entrance's previous completion listener.
    pendingUnfurls.get(paper)?.();

    const names = [
      'animation',
      'height',
      'min-height',
      'max-height'
    ];

    const saved = names.map(name => ({
      name,
      value: paper.style.getPropertyValue(name),
      priority: paper.style.getPropertyPriority(name)
    }));

    let targetHeight;

    try {
      // Measure natural height synchronously, before the next paint.
      paper.style.setProperty('animation', 'none', 'important');
      paper.style.setProperty('height', 'auto', 'important');
      paper.style.setProperty(
        'min-height',
        'var(--scroll-unfurl-min-height, 72vh)',
        'important'
      );
      paper.style.setProperty('max-height', 'none', 'important');

      targetHeight = window.getComputedStyle(paper).height;
    } finally {
      saved.forEach(({ name, value, priority }) => {
        if (value) {
          paper.style.setProperty(name, value, priority);
        } else {
          paper.style.removeProperty(name);
        }
      });
    }

    paper.style.setProperty(
      '--scroll-unfurl-max-height',
      targetHeight
    );

    function detach() {
      paper.removeEventListener('animationend', onEnd);
      pendingUnfurls.delete(paper);
    }

    function onEnd(event) {
      if (
        event.target !== paper ||
        event.animationName !== 'scrollUnfurlDown'
      ) return;

      // Release the cap for later loaded or expanded content.
      paper.style.setProperty('--scroll-unfurl-max-height', 'none');
      detach();
    }

    pendingUnfurls.set(paper, detach);
    paper.addEventListener('animationend', onEnd);
  };
}

function patchLayout(text) {
  if (/\bscrollMovePosition\b|\bprepareScrollUnfurl\b/.test(text)) {
    throw new Error(
      'A helper with the requested name already exists. No files changed.'
    );
  }

  text = editSection(
    text,
    '<!-- HOME_DESKTOP_CLICK_V1 -->',
    '<!-- SCROLL_CLOSE_NEWSLETTER_V1 desktop and newsletter -->',
    section => {
      section = replaceOne(
        section,
        /\bmovement\s*=\s*stage\.animate\([\s\S]*?\);/g,
        'movement = window.scrollMovePosition(stage, 0, from);',
        'Initial position movement'
      );

      return replaceOne(
        section,
        "stage.dataset.homeUnfurl = 'opening';",
        "window.prepareScrollUnfurl(paper);\n" +
          "        stage.dataset.homeUnfurl = 'opening';",
        'Initial unfurl preparation'
      );
    }
  );

  text = editSection(
    text,
    '<!-- SCROLL_CLOSE_NEWSLETTER_V1 desktop and newsletter -->',
    '<!-- STEP13_MAILERLITE_SCRIPT_START -->',
    section => {
      section = replaceOne(
        section,
        /\brepeatMovement\s*=\s*stage\.animate\([\s\S]*?\);/g,
        'repeatMovement = window.scrollMovePosition(stage, target, from);',
        'Repeat position movement'
      );

      return replaceOne(
        section,
        /paper\.style\.animation\s*=\s*(?=['"]scrollUnfurlDown)/g,
        'window.prepareScrollUnfurl(paper);\n' +
          '        paper.style.animation = ',
        'Repeat unfurl preparation'
      );
    }
  );

  const script =
    '<!-- ' + marker + ' -->\n' +
    '    <script is:inline>\n(' +
    sharedScrollHelpers.toString() +
    ')();\n    </script>\n    ';

  return replaceOne(
    text,
    '<!-- HOME_DESKTOP_CLICK_V1 -->',
    script + '<!-- HOME_DESKTOP_CLICK_V1 -->',
    'Shared helpers'
  );
}

function patchCss(text) {
  if (
    text.includes('--scroll-move-duration') ||
    text.includes('--scroll-move-easing')
  ) {
    throw new Error(
      'Shared movement settings already exist. No files changed.'
    );
  }

  return replaceOne(
    text,
    /--unfurl-easing\s*:\s*[^;]+;/g,
    `--unfurl-easing: cubic-bezier(0.33, 1, 0.62, 1);
  /* ${marker}: shared by all three desktop position movements. */
  --scroll-move-duration: 1000ms;
  --scroll-move-easing: cubic-bezier(0.25, 0.1, 0.25, 1);`,
    'Shared CSS settings'
  );
}

async function main() {
  const files = [];

  for (const [relative, patch] of [
    ['src/layouts/BaseLayout.astro', patchLayout],
    ['src/styles/global.css', patchCss]
  ]) {
    const filename = path.join(root, relative);
    const original = await readFile(filename);

    files.push({
      filename,
      relative,
      original,
      patch,
      text: original.toString('utf8').replace(/\r/g, '')
    });
  }

  const marked = files.filter(file => file.text.includes(marker));

  if (marked.length === files.length) {
    console.log('Already applied. No files changed.');
    return;
  }

  if (marked.length) {
    throw new Error(
      'Only one file has the patch marker. Resolve the partial patch before retrying.'
    );
  }

  // Validate both files completely before editing either one.
  for (const file of files) {
    const updated = file.patch(file.text);

    file.updated = file.original.includes(Buffer.from('\r\n'))
      ? updated.replace(/\n/g, '\r\n')
      : updated;
  }

  if (args.includes('--dry-run')) {
    console.log(
      'Validated. Would update:\n' +
      files.map(file => file.relative).join('\n')
    );
    return;
  }

  const attempted = [];

  try {
    for (const file of files) {
      if (!(await readFile(file.filename)).equals(file.original)) {
        throw new Error(file.relative + ' changed during patching.');
      }

      attempted.push(file);
      await writeFile(file.filename, file.updated);
    }
  } catch (error) {
    // Restore from memory on failure; no backup files are created.
    for (const file of attempted.reverse()) {
      try {
        await writeFile(file.filename, file.original);
      } catch (restoreError) {
        console.error(
          'Restore failed for ' + file.relative + ': ' +
          restoreError.message
        );
      }
    }
    throw error;
  }

  console.log(
    'Updated BaseLayout.astro and global.css. No backup files created.'
  );
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});