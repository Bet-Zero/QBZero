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

  // Check if canvas has valid dimensions
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error(
      `Invalid canvas dimensions: ${canvas.width}x${canvas.height}`
    );
  }

  // Small delay to ensure canvas is fully rendered (critical for mobile)
  await sleep(150);

  // Check if canvas is tainted (which can cause toBlob to fail)
  let isTainted = false;
  try {
    // This will throw if canvas is tainted
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.getImageData(0, 0, 1, 1);
    }
  } catch (e) {
    console.warn('Canvas may be tainted, will use fallback method');
    isTainted = true;
  }

  // On mobile or if tainted, prefer toDataURL method which is more reliable
  const preferDataURL = isIOS || isTainted;

  if (!preferDataURL && canvas.toBlob) {
    // Try the native toBlob method first (for desktop)
    try {
      const blob = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Canvas toBlob timeout'));
        }, 15000); // 15 second timeout for slower devices

        try {
          canvas.toBlob(
            (result) => {
              clearTimeout(timeout);
              if (result && result.size > 0) {
                resolve(result);
              } else {
                reject(new Error('Canvas toBlob returned null or empty blob'));
              }
            },
            'image/png',
            1.0 // Use full quality
          );
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });

      if (blob && blob.size > 0) {
        console.log('Successfully created blob using toBlob method');
        return blob;
      }
    } catch (error) {
      console.warn('Native toBlob failed, trying fallback:', error.message);
    }
  }

  // Fallback method using toDataURL (preferred for mobile/iOS)
  try {
    console.log('Using toDataURL method for blob conversion');
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    if (!dataUrl || dataUrl === 'data:,') {
      throw new Error('Canvas toDataURL returned empty data');
    }

    // Convert data URL to blob manually (more reliable than fetch on mobile)
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Failed to extract base64 data from dataURL');
    }

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'image/png' });
    
    if (!blob || blob.size === 0) {
      throw new Error('Converted blob is empty');
    }

    console.log('Successfully created blob using toDataURL method, size:', blob.size);
    return blob;
  } catch (error) {
    console.error('Fallback toDataURL method also failed:', error);
    throw new Error(`Failed to convert canvas to blob: ${error.message}`);
  }
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
      await sleep(200); // Increased wait time for mobile devices

      let blob;
      let canvas;
      
      if (isIOS) {
        const html2canvas = (
          await import('html2canvas/dist/html2canvas.esm.js')
        ).default;
        canvas = await html2canvas(el, {
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
      } else {
        canvas = await toCanvas(el, {
          cacheBust: true,
          skipFonts: true,
          pixelRatio,
          backgroundColor: options.backgroundColor ?? '#111',
          width: width || undefined,
          height: height || undefined,
          canvasWidth: width || undefined,
          canvasHeight: height || undefined,
        });
      }

      // Verify canvas was created successfully
      if (!canvas) {
        throw new Error('Failed to create canvas from element');
      }

      console.log('Canvas created successfully:', {
        width: canvas.width,
        height: canvas.height,
        isIOS
      });

      blob = await canvasToBlob(canvas);

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
