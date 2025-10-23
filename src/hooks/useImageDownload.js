// useImageDownload.js — iOS-safe export, no warping (dimension-lock + safe scrub + blob/objectURL inlining)
import { toCanvas } from 'html-to-image';
import { antonBase64CSS } from '@/fonts/antonBase64';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isIOS = (() => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iP(hone|ad|od)/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
})();

/* ---------- fetch helpers ---------- */
async function fetchBlob(url) {
  const res = await fetch(url, {
    cache: 'no-store',
    credentials: 'omit',
    mode: 'cors',
  });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return await res.blob();
}

/* ---------- image load control ---------- */
function forceEagerImages(root) {
  root.querySelectorAll('img').forEach((img) => {
    img.setAttribute('loading', 'eager');
    img.setAttribute('decoding', 'sync');
  });
}

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

/* ---------- dimension locking (prevents stretch/warp) ---------- */
function lockDimensions(root) {
  const entries = [];
  const all = root.querySelectorAll('*');

  all.forEach((el) => {
    const cs = getComputedStyle(el);

    // only lock real boxes
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;

    const record = { el, width: el.style.width, height: el.style.height };
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    entries.push(record);

    // for <img>, also pin object-fit/position via wrapper style so html2canvas matches
    if (el.tagName === 'IMG') {
      entries.push(
        { el, prop: 'objectFit', prev: el.style.objectFit },
        { el, prop: 'objectPosition', prev: el.style.objectPosition },
        { el, prop: 'maxWidth', prev: el.style.maxWidth },
        { el, prop: 'maxHeight', prev: el.style.maxHeight }
      );
      el.style.objectFit = cs.objectFit || 'cover';
      el.style.objectPosition = cs.objectPosition || '50% 50%';
      el.style.maxWidth = `${w}px`;
      el.style.maxHeight = `${h}px`;
    }
  });

  return () => {
    entries.forEach((r) => {
      if ('prop' in r) r.el.style[r.prop] = r.prev;
      else {
        r.el.style.width = r.width;
        r.el.style.height = r.height;
      }
    });
  };
}

/* ---------- SAFE scrub (no transform!) ---------- */
function scrubPaintBreakers(root) {
  const entries = [];
  const props = [
    'filter',
    'backdropFilter',
    'webkitBackdropFilter',
    'mixBlendMode',
    'clipPath',
    'webkitMaskImage',
    'maskImage',
  ];

  root.querySelectorAll('*').forEach((el) => {
    const rec = { el, prev: {} };
    let touched = false;
    const cs = getComputedStyle(el);

    props.forEach((p) => {
      const cssProp = p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      const val = cs[p] || cs[cssProp];
      if (val && val !== 'none' && val !== 'normal') {
        rec.prev[p] = el.style[p];
        el.style[p] = p.includes('mix') ? 'normal' : 'none';
        touched = true;
      }
    });

    if (touched) entries.push(rec);
  });

  return () => {
    entries.forEach(({ el, prev }) => {
      Object.keys(prev).forEach((p) => {
        el.style[p] = prev[p];
      });
    });
  };
}

/* ---------- Anton font ---------- */
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

const canvasToBlob = async (canvas) => {
  if (!canvas) throw new Error('Canvas element is required');

  if (canvas.toBlob) {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('Canvas toBlob returned null'));
      }, 'image/png');
    });
    return blob;
  }

  const dataUrl = canvas.toDataURL('image/png');
  const response = await fetch(dataUrl);
  return await response.blob();
};

const useImageDownload = (ref) => {
  const download = async (filename, options = {}) => {
    if (!ref.current) {
      console.error('useImageDownload: ref.current is null');
      throw new Error('Export container ref is not attached');
    }

    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const width = Math.max(
      options.width || 0,
      el.scrollWidth || el.offsetWidth || rect.width || 0
    );
    const height = Math.max(
      options.height || 0,
      el.scrollHeight || el.offsetHeight || rect.height || 0
    );
    const pixelRatio = Math.min(
      options.pixelRatio ||
        (typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2),
      3
    );
    let styleEl = null;
    let restoreDims = null;
    let restoreScrub = null;

    const keep = {
      opacity: el.style.opacity,
      zIndex: el.style.zIndex,
      top: el.style.top,
      position: el.style.position,
      left: el.style.left,
      pointerEvents: el.style.pointerEvents,
    };

    try {
      styleEl = await ensureAnton(el);

      // Don't move the element - keep it in place to avoid security issues
      el.style.opacity = '1';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '9999';

      forceEagerImages(el);
      await waitForImages(el);

      // freeze sizes so swapping sources can't stretch anything
      restoreDims = lockDimensions(el);

      // Skip the problematic blob URL conversion that causes security errors

      // remove only known paint-breakers
      restoreScrub = scrubPaintBreakers(el);

      await new Promise((r) => requestAnimationFrame(r));
      await sleep(100);

      let blob;
      if (isIOS) {
        const html2canvas = (
          await import('html2canvas/dist/html2canvas.esm.js')
        ).default;
        const canvas = await html2canvas(el, {
          backgroundColor: options.backgroundColor ?? '#111',
          scale: pixelRatio,
          useCORS: true,
          allowTaint: true, // Allow tainted canvas to handle CORS issues
          logging: false,
          imageTimeout: 15000,
          width: width || undefined,
          height: height || undefined,
          windowWidth: width || undefined,
          windowHeight: height || undefined,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          onclone: (doc) => {
            // ensure no lazy settings in clone
            doc
              .querySelectorAll('img[loading]')
              .forEach((n) => n.removeAttribute('loading'));
            doc
              .querySelectorAll('img[decoding]')
              .forEach((n) => n.removeAttribute('decoding'));
          },
        });
        blob = await canvasToBlob(canvas);
      } else {
        const canvas = await toCanvas(el, {
          cacheBust: true,
          skipFonts: true,
          pixelRatio,
          backgroundColor: options.backgroundColor ?? '#111',
          width: width || undefined,
          height: height || undefined,
          canvasWidth: width || undefined,
          canvasHeight: height || undefined,
        });
        blob = await canvasToBlob(canvas);
      }

      if (!blob) {
        throw new Error('Failed to generate image blob');
      }

      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = filename;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      // Small delay to ensure download starts
      await sleep(100);
    } catch (err) {
      console.error('Download failed', err);
      throw err;
    } finally {
      if (restoreScrub) restoreScrub();
      if (restoreDims) restoreDims();
      if (styleEl) styleEl.remove();

      el.style.opacity = keep.opacity;
      el.style.zIndex = keep.zIndex;
      el.style.top = keep.top;
      el.style.position = keep.position;
      el.style.left = keep.left;
      if (keep.pointerEvents) el.style.pointerEvents = keep.pointerEvents;
      else el.style.removeProperty('pointer-events');
    }
  };

  return download;
};

export default useImageDownload;
