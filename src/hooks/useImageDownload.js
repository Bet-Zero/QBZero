// useImageDownload.js — reliable mobile export (iOS-safe): blob/objectURL inlining + style scrub + iOS html2canvas path
import { toPng } from 'html-to-image';
import { antonBase64CSS } from '@/fonts/antonBase64';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Tiny iOS detector (we route to html2canvas there) */
const isIOS = (() => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iP(hone|ad|od)/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
})();

/** Fetch → Blob */
async function fetchBlob(url) {
  const res = await fetch(url, {
    cache: 'no-store',
    credentials: 'omit',
    mode: 'cors',
  });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return await res.blob();
}

/** Force all <img> to be eager + sync for Safari */
function forceEagerImages(root) {
  root.querySelectorAll('img').forEach((img) => {
    img.setAttribute('loading', 'eager');
    img.setAttribute('decoding', 'sync');
  });
}

/** Wait until all <img> are loaded (or errored) */
async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return;
      return new Promise((resolve) => {
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    })
  );
}

/**
 * Inline every <img> and every CSS background-image `url(...)` as Blob -> objectURL.
 * We prefer object URLs over data: URLs (iOS is significantly more stable with them).
 * Returns a restore() that revokes objectURLs and original attrs.
 */
async function inlineAsObjectURLs(root) {
  const revokeQueue = [];
  const restorers = [];

  // <img> tags
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const prev = {
        src: img.getAttribute('src'),
        srcset: img.getAttribute('srcset'),
        cross: img.getAttribute('crossorigin'),
      };
      restorers.push(() => {
        if (prev.src !== null) img.setAttribute('src', prev.src);
        if (prev.srcset !== null) img.setAttribute('srcset', prev.srcset);
        if (prev.cross !== null) img.setAttribute('crossorigin', prev.cross);
        else img.removeAttribute('crossorigin');
      });

      if (prev.srcset) img.removeAttribute('srcset'); // stop Safari from swapping
      const actual = img.currentSrc || img.src;
      if (!actual) return;

      try {
        const blob = await fetchBlob(actual);
        const url = URL.createObjectURL(blob);
        revokeQueue.push(url);
        img.setAttribute('crossorigin', 'anonymous');
        img.src = url;
        if (img.decode) {
          try {
            await img.decode();
          } catch {}
        } else {
          await sleep(16);
        }
      } catch {
        // keep original on failure
      }
    })
  );

  // CSS backgrounds
  const nodes = Array.from(root.querySelectorAll('*'));
  await Promise.all(
    nodes.map(async (el) => {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundImage;
      if (!bg || bg === 'none') return;

      const matches = [...bg.matchAll(/url\((["']?)(.*?)\1\)/g)];
      const urls = matches
        .map((m) => m[2])
        .filter((u) => u && !u.startsWith('data:') && !u.startsWith('blob:'));
      if (urls.length === 0) return;

      const prevBg = el.style.backgroundImage;
      restorers.push(() => {
        el.style.backgroundImage = prevBg;
      });

      let newBg = bg;
      for (const u of urls) {
        try {
          const blob = await fetchBlob(u);
          const url = URL.createObjectURL(blob);
          revokeQueue.push(url);
          const esc = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          newBg = newBg.replace(new RegExp(esc, 'g'), url);
        } catch {
          // ignore this layer
        }
      }
      el.style.backgroundImage = newBg;
    })
  );

  return () => {
    restorers.reverse().forEach((fn) => fn());
    revokeQueue.forEach((u) => URL.revokeObjectURL(u));
  };
}

/**
 * Scrub paint-breaking styles during capture (Safari/html2canvas/html-to-image can drop layers).
 * We remove: transform, filter, backdrop-filter, mix-blend-mode, clip-path, mask-image.
 * Returns a restore() to put everything back.
 */
function scrubProblemStyles(root) {
  const entries = [];
  const props = [
    'transform',
    'filter',
    'backdropFilter',
    'mixBlendMode',
    'webkitBackdropFilter',
    'clipPath',
    'webkitMaskImage',
    'maskImage',
  ];

  root.querySelectorAll('*').forEach((el) => {
    const record = { el, prev: {} };
    let touched = false;
    props.forEach((p) => {
      const cssProp = p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      const cur = (el.style && el.style[p]) || '';
      // Only scrub if the computed style is actually set (prevents unnecessary writes)
      const computed = getComputedStyle(el);
      const val = computed[cssProp] || computed[p];
      if (val && val !== 'none' && val !== 'normal') {
        record.prev[p] = el.style[p];
        el.style[p] = p.includes('mix') ? 'normal' : 'none';
        touched = true;
      }
    });
    if (touched) entries.push(record);
  });

  return () => {
    entries.forEach(({ el, prev }) => {
      Object.keys(prev).forEach((p) => {
        el.style[p] = prev[p];
      });
    });
  };
}

/** Register the inlined Anton font in a way both libs will use */
async function ensureAnton(refEl) {
  const match = antonBase64CSS.match(/base64,([^)]+)\)/);
  if (!match) return null;
  const font = new FontFace(
    'AntonBase64',
    `url(data:font/woff2;base64,${match[1]}) format('woff2')`,
    { weight: '400', style: 'normal' }
  );
  await font.load();
  document.fonts.add(font);
  await document.fonts.load('1em AntonBase64');
  await document.fonts.ready;

  const styleEl = document.createElement('style');
  styleEl.textContent = antonBase64CSS;
  refEl.prepend(styleEl);
  return styleEl;
}

const useImageDownload = (ref) => {
  const download = async (filename, options = {}) => {
    if (!ref.current) return;

    let styleEl = null;
    let restoreInline = null;
    let restoreScrub = null;

    // temp visibility adjustment (keep on screen-ish for Safari layout)
    const el = ref.current;
    const keep = {
      opacity: el.style.opacity,
      zIndex: el.style.zIndex,
      top: el.style.top,
      position: el.style.position,
    };
    try {
      styleEl = await ensureAnton(el);

      // Make element paintable without hiding it from layout
      el.style.position = el.style.position || 'relative';
      el.style.top = '0';
      el.style.opacity = '1';
      el.style.zIndex = '-1';

      // 1) Force eager loads, then wait once
      forceEagerImages(el);
      await waitForImages(el);

      // 2) Inline everything as Blob/objectURL (more reliable on iOS than data:)
      restoreInline = await inlineAsObjectURLs(el);

      // 3) Scrub transforms/filters/etc that cause Safari to drop layers
      restoreScrub = scrubProblemStyles(el);

      await new Promise((r) => requestAnimationFrame(r));
      await sleep(60);

      // 4) Snapshot
      let dataUrl;
      if (isIOS) {
        // Prefer html2canvas on iOS — avoids foreignObject pitfalls
        const html2canvas = (
          await import('html2canvas/dist/html2canvas.esm.js')
        ).default;
        const canvas = await html2canvas(el, {
          backgroundColor: options.backgroundColor ?? '#111',
          scale: options.pixelRatio ?? 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 8000,
          windowWidth: el.scrollWidth,
          windowHeight: el.scrollHeight,
          onclone: (doc) => {
            doc
              .querySelectorAll('img[loading]')
              .forEach((n) => n.removeAttribute('loading'));
            doc
              .querySelectorAll('img[decoding]')
              .forEach((n) => n.removeAttribute('decoding'));
          },
        });
        dataUrl = canvas.toDataURL('image/png');
      } else {
        // Desktop: html-to-image is fine & sharper
        dataUrl = await toPng(el, {
          cacheBust: true,
          skipFonts: true,
          pixelRatio: options.pixelRatio ?? 2,
          backgroundColor: options.backgroundColor ?? '#111',
        });
      }

      // 5) Download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      if (restoreScrub) restoreScrub();
      if (restoreInline) restoreInline();
      if (styleEl) styleEl.remove();

      // restore visibility
      el.style.opacity = keep.opacity;
      el.style.zIndex = keep.zIndex;
      el.style.top = keep.top;
      el.style.position = keep.position;
    }
  };

  return download;
};

export default useImageDownload;
