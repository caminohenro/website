#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const MARKER = 'REPEAT_SCROLL_ENTRANCE_V1';
const args = process.argv.slice(2);
const positional = args.filter(arg => arg !== '--dry-run');

if (
  positional.length > 1 ||
  args.some(arg => arg.startsWith('--') && arg !== '--dry-run')
) {
  console.error(
    'Usage: node repeat-scroll-entrance.mjs [project-directory] [--dry-run]'
  );
  process.exit(1);
}

const root = path.resolve(positional[0] || '.');
const filename = path.join(root, 'src/layouts/BaseLayout.astro');

function replaceOnce(text, before, after, label) {
  const count = text.split(before).length - 1;
  if (count !== 1) {
    throw new Error(
      `${label}: expected one matching block, found ${count}. No files changed.`
    );
  }
  return text.replace(before, after);
}

function replaceSection(text, startMarker, endMarker, transform, label) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);

  if (start < 0 || end <= start) {
    throw new Error(`${label}: section not found. No files changed.`);
  }

  return (
    text.slice(0, start) +
    transform(text.slice(start, end)) +
    text.slice(end)
  );
}

function bodyOf(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf('{') + 1, source.lastIndexOf('}'));
}

/*
 * Inserted inside the mobile physics controller.
 */
function mobilePositionCode() {
    // REPEAT_SCROLL_ENTRANCE_V1
    let mobilePositionFrame = 0;
    let mobileOffset = 0;
    let mobileCentered = false;
    let mobileHasInteracted = false;

    function moveMobilePosition(target, finished) {
      window.cancelAnimationFrame(mobilePositionFrame);
      dismissHint();

      const from = mobileOffset;
      const startedAt = performance.now();
      const duration = reducedMotion.matches ? 0 : 700;

      function step(now) {
        if (disposed) return;

        const progress = duration
          ? Math.min(1, (now - startedAt) / duration)
          : 1;
        const eased = 1 - Math.pow(1 - progress, 3);
        const previousOffset = mobileOffset;

        mobileOffset = from + (target - from) * eased;
        setStyle(stage, 'translate', '0px ' + mobileOffset + 'px');

        // Keep the roller under the finger while the stage moves upward.
        if (dragging) {
          revealed = clamp(
            revealed + previousOffset - mobileOffset,
            0,
            height
          );
          render();
        }

        if (progress < 1) {
          mobilePositionFrame = window.requestAnimationFrame(step);
        } else {
          mobilePositionFrame = 0;
          if (finished) finished();
        }
      }

      mobilePositionFrame = window.requestAnimationFrame(step);
    }

    function centerClosedMobile() {
      if (mobileCentered || dragging || opening || revealed > 0.01) return;

      mobileCentered = true;
      window.scrollTo({ top: 0, behavior: 'instant' });

      const rollerCenter =
        (
          topRoller.getBoundingClientRect().top +
          roller.getBoundingClientRect().bottom
        ) / 2 + window.scrollY - mobileOffset;

      const view = viewport();
      const target = Math.max(
        0,
        view.top + view.height / 2 - rollerCenter
      );

      moveMobilePosition(target, updateHint);
    }

    function returnMobileToTop() {
      mobileHasInteracted = true;

      if (!mobileCentered && mobileOffset === 0) return;
      mobileCentered = false;
      moveMobilePosition(0, updateHint);
    }
}

/*
 * Inserted inside the existing desktop/newsletter controller.
 */
function desktopRepeatCode() {
    const savedStageTranslate = stage.style.translate;
    const savedPaperAnimation = paper.style.animation;

    let repeatMovement = null;
    let repeatHintTimer = 0;
    let repeatEpoch = 0;

    const repeatHint =
      stage.querySelector('.home-click-hint')?.cloneNode(true) ||
      document.createElement('div');

    repeatHint.className = 'home-click-hint';

    if (!repeatHint.innerHTML.trim()) {
      repeatHint.innerHTML =
        '<svg viewBox="0 0 36 40" width="26" height="29" aria-hidden="true">' +
          '<g class="home-click-pointer">' +
            '<path d="M12 11V31L17 26L21 35L25 33L21 24H29Z"/>' +
          '</g>' +
          '<g class="home-click-rays">' +
            '<path d="M12 2V5M4 5L6.5 7.5M2 13H5M20 5L17.5 7.5"/>' +
          '</g>' +
        '</svg><span>Click to unfurl</span>';
    }

    repeatHint.setAttribute('aria-hidden', 'true');
    repeatHint.style.display = 'flex';
    repeatHint.style.animation = 'homeClickHintIn 450ms ease both';
    repeatHint.style.opacity = '1';
    repeatHint.style.transform = 'translateX(-50%)';
    stage.appendChild(repeatHint);

    function hideRepeatHint() {
      window.clearTimeout(repeatHintTimer);
      repeatHintTimer = 0;
      repeatHint.style.display = 'none';
    }

    function showRepeatHintLater() {
      hideRepeatHint();
      repeatHintTimer = window.setTimeout(() => {
        repeatHintTimer = 0;
        if (!disposed && closed && !closing) {
          repeatHint.style.display = 'flex';
        }
      }, 1000);
    }

    async function moveDesktopPosition(target) {
      if (repeatMovement) repeatMovement.cancel();

      const from = window.getComputedStyle(stage).translate;
      const destination = '0px ' + target + 'px';

      if (!reduced.matches) {
        repeatMovement = stage.animate(
          [
            { translate: from === 'none' ? '0px 0px' : from },
            { translate: destination }
          ],
          {
            duration: 700,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both'
          }
        );

        const current = repeatMovement;
        await current.finished.catch(() => {});

        if (disposed || repeatMovement !== current) return false;

        stage.style.translate = destination;
        current.cancel();
        repeatMovement = null;
      } else {
        stage.style.translate = destination;
      }

      placeNewsletter();
      return true;
    }

    async function animateScroll(shouldClose) {
      const epoch = ++repeatEpoch;
      hideRepeatHint();
      window.cancelAnimationFrame(frame);

      if (repeatMovement) {
        // Preserve the visible position before cancelling a movement.
        stage.style.translate = window.getComputedStyle(stage).translate;
        repeatMovement.cancel();
        repeatMovement = null;
      }

      owned = true;

      if (!shouldClose) {
        closed = false;
        closing = false;
        refreshControls();

        const completed = await moveDesktopPosition(0);
        if (!completed || disposed || epoch !== repeatEpoch) return;

        /*
         * Release manual height control and replay the original CSS unfurl.
         * The rollers then follow the paper through normal layout.
         */
        stage.dataset.homeUnfurl = 'opening';
        paper.style.animation = 'none';
        delete stage.dataset.wholeScrollControl;
        stage.style.removeProperty('--whole-scroll-height');

        void paper.offsetHeight;

        paper.inert = previousInert;
        paper.style.animation =
          'scrollUnfurlDown var(--unfurl-duration, 8s) ' +
          'var(--unfurl-easing, cubic-bezier(0.33, 1, 0.62, 1)) ' +
          'var(--pause-duration, 0.1s) both';

        refreshControls();
        placeNewsletter();
        return;
      }

      const from = paper.getBoundingClientRect().height;
      stage.style.setProperty('--whole-scroll-height', from + 'px');
      stage.dataset.wholeScrollControl = 'true';

      closing = true;
      closed = false;
      top.focus({ preventScroll: true });
      paper.inert = true;
      refreshControls();

      const startedAt = performance.now();
      const duration = reduced.matches ? 0 : 900;
      let previousHeight = from;

      function step(now) {
        if (disposed || epoch !== repeatEpoch) return;

        const progress = duration
          ? Math.min(1, (now - startedAt) / duration)
          : 1;
        const eased = progress * progress * (3 - 2 * progress);
        const nextHeight = from * (1 - eased);

        const documentTop =
          paper.getBoundingClientRect().top + window.scrollY;
        const removed = Math.max(0, previousHeight - nextHeight);
        const targetY = Math.max(
          0,
          window.scrollY -
            Math.min(removed, Math.max(0, window.scrollY - documentTop))
        );

        stage.style.setProperty('--whole-scroll-height', nextHeight + 'px');
        previousHeight = nextHeight;
        placeNewsletter();
        window.scrollTo({ top: targetY, behavior: 'instant' });

        if (progress < 1) {
          frame = window.requestAnimationFrame(step);
          return;
        }

        frame = 0;
        closed = true;
        closing = false;
        refreshControls();

        window.scrollTo({ top: 0, behavior: 'instant' });

        const currentTranslate = window.getComputedStyle(stage).translate;
        const offset = currentTranslate === 'none'
          ? 0
          : parseFloat(currentTranslate.split(/\s+/)[1]) || 0;

        const center =
          (
            top.getBoundingClientRect().top +
            bottom.getBoundingClientRect().bottom
          ) / 2 + window.scrollY - offset;

        const visual = window.visualViewport;
        const screenCenter = visual
          ? visual.offsetTop + visual.height / 2
          : window.innerHeight / 2;

        moveDesktopPosition(Math.max(0, screenCenter - center)).then(ok => {
          if (ok && !disposed && epoch === repeatEpoch && closed) {
            showRepeatHintLater();
          }
        });
      }

      frame = window.requestAnimationFrame(step);
    }
}

async function main() {
  const original = await readFile(filename);

  // Some previously generated sections contain repeated CR characters.
  // Normalize those for matching, then restore the file's newline style.
  let text = original.toString('utf8').replace(/\r/g, '');

  if (text.includes(MARKER)) {
    console.log('Patch already applied. No changes.');
    return;
  }

  if (!text.includes('SCROLL_CLOSE_NEWSLETTER_V1')) {
    throw new Error('The previous close/newsletter patch was not found.');
  }

  const desktopMarker =
    '    <!-- SCROLL_CLOSE_NEWSLETTER_V1 desktop and newsletter -->';

  // Mobile changes are scoped to the mobile controller.
  text = replaceSection(
    text,
    '    function updateHint() {',
    '    <!-- STEP17_MOBILE_SCROLL_PHYSICS_END -->',
    section => {
      section = replaceOnce(
        section,
        "      if (!startsClosed) { dismissHint(); return; }",
        `      if (mobilePositionFrame || opening) {
        dismissHint();
        return;
      }

      if (
        revealed <= 0.01 &&
        !dragging &&
        !mobileCentered &&
        (startsClosed || mobileHasInteracted)
      ) {
        centerClosedMobile();
        return;
      }`,
        'Reusable mobile hint'
      );

      section = replaceOnce(
        section,
        '    let topCloseFrame = 0;',
        bodyOf(mobilePositionCode) + '\n    let topCloseFrame = 0;',
        'Mobile centering helpers'
      );

      // This callback is inside the mobile physics controller.
      section = replaceOnce(
        section,
        '      dragging = true;',
        '      dragging = true;\n      returnMobileToTop();',
        'Mobile return-to-top movement'
      );

      section = replaceOnce(
        section,
        '      disposed = true;\n      cancelTopClose();',
        `      disposed = true;
      window.cancelAnimationFrame(mobilePositionFrame);
      cancelTopClose();`,
        'Mobile movement cleanup'
      );

      return section;
    },
    'Mobile controller'
  );

  // Replace only the desktop close/reopen implementation.
  text = replaceSection(
    text,
    desktopMarker,
    '    <!-- STEP13_MAILERLITE_SCRIPT_START -->',
    section => {
      section = replaceSection(
        section,
        '    function animateScroll(shouldClose) {',
        '    function onRoller(event) {',
        () => bodyOf(desktopRepeatCode) + '\n\n',
        'Desktop animation implementation'
      );

      section = replaceOnce(
        section,
        '      controls.abort();',
        `      controls.abort();
      repeatEpoch++;
      hideRepeatHint();
      if (repeatMovement) repeatMovement.cancel();
      repeatHint.remove();
      stage.style.translate = savedStageTranslate;
      paper.style.animation = savedPaperAnimation;`,
        'Desktop movement cleanup'
      );

      return section;
    },
    'Desktop controller'
  );

  if (args.includes('--dry-run')) {
    console.log('Patch validated. Would update:\n' + filename);
    return;
  }

  const backupDirectory = path.join(
    root,
    '.scroll-fix-backups',
    'repeat-entrance-' + Date.now()
  );

  await mkdir(backupDirectory, { recursive: true });
  const backupFile = path.join(backupDirectory, 'BaseLayout.astro');
  await writeFile(backupFile, original, { flag: 'wx' });

  if (!(await readFile(filename)).equals(original)) {
    throw new Error('BaseLayout.astro changed during patching. No changes applied.');
  }

  if (original.includes(Buffer.from('\r\n'))) {
    text = text.replace(/\n/g, '\r\n');
  }

  try {
    await writeFile(filename, text);
  } catch (error) {
    await writeFile(filename, original);
    throw error;
  }

  console.log('Updated: ' + filename + '\nOriginal backup: ' + backupFile);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});