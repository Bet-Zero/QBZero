// useImageDownload.js — minimal: inline <img> + decode + html-to-image
import { toPng } from 'html-to-image';
import { antonBase64CSS } from '@/fonts/antonBase64';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Convert a URL (same-origin OK) to a data URL.
 */
async function urlToDataUrl(url) {
  const res = await fetch(url, {
    cache: 'no-store',
    credentials: 'omit',
    mode: 'cors',
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

/**
 * Inline <img> and CSS background images within root into data URLs.
 * Returns a restore() function to revert DOM after export.
 */
async function inlineImages(root) {
  const restorers = [];

  // 1) Inline <img> nodes
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const prevSrc = img.getAttribute('src');
      const prevSrcSet = img.getAttribute('srcset');
      const prevCross = img.getAttribute('crossorigin');

      restorers.push(() => {
        if (prevSrc !== null) img.setAttribute('src', prevSrc);
        if (prevSrcSet !== null) img.setAttribute('srcset', prevSrcSet);
        if (prevCross !== null) img.setAttribute('crossorigin', prevCross);
        else img.removeAttribute('crossorigin');
      });

      // Disable srcset so Safari doesn't pick a different resource during clone
      if (prevSrcSet) img.removeAttribute('srcset');

      const actual = img.currentSrc || img.src;
      if (!actual) return;

      try {
        const dataUrl = await urlToDataUrl(actual);
        img.setAttribute('crossorigin', 'anonymous');
        img.src = dataUrl;

        // give layout a tick, then ensure pixels are decoded
        await sleep(10);
        if (img.decode) {
          try {
            await img.decode();
          } catch {}
        }
      } catch {
        // If we can't inline, leave original. Same-origin should succeed though.
      }
    })
  );

  // 2) Inline CSS background-image URLs (preserve gradients & multiple layers)
  const all = Array.from(root.querySelectorAll('*'));
  await Promise.all(
    all.map(async (el) => {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundImage;
      if (!bg || bg === 'none') return;

      // Find every url(...) in the computed background-image, but do NOT touch gradients
      const matches = [...bg.matchAll(/url\((["']?)(.*?)\1\)/g)];
      const urls = matches
        .map((m) => m[2])
        .filter((u) => u && !u.startsWith('data:'));
      if (urls.length === 0) return;

      const prev = el.style.backgroundImage;
      restorers.push(() => {
        el.style.backgroundImage = prev;
      });

      let newBg = bg;
      for (const u of urls) {
        try {
          const dataUrl = await urlToDataUrl(u);
          // Replace all occurrences of this exact URL inside the background string
          const esc = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape for RegExp
          newBg = newBg.replace(new RegExp(esc, 'g'), dataUrl);
        } catch {
          // if one URL fails to inline, leave that one as-is
        }
      }

      el.style.backgroundImage = newBg;
    })
  );

  // 3) Remove clip-path/mask from <img> only (rare iOS drop); border-radius is OK
  const masked = imgs.filter((img) => {
    const s = getComputedStyle(img);
    return s.clipPath !== 'none' || s.maskImage !== 'none';
  });
  masked.forEach((img) => {
    const prevClip = img.style.clipPath;
    const prevMask = img.style.webkitMaskImage || img.style.maskImage;

    restorers.push(() => {
      img.style.clipPath = prevClip;
      img.style.webkitMaskImage = prevMask;
      img.style.maskImage = prevMask;
    });

    img.style.clipPath = 'none';
    img.style.webkitMaskImage = 'none';
    img.style.maskImage = 'none';
  });

  return () => restorers.reverse().forEach((fn) => fn());
}

/**
 * Ensure all <img> have fired load/error. (Useful when offscreen.)
 */
const waitForImages = async (root) => {
  if (!root) return;
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
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
};

const useImageDownload = (ref) => {
  const download = async (filename, options = {}) => {
    if (!ref.current) return;

    let styleEl = null;
    let restoreStyles = null;
    let restoreImages = null;

    try {
      // 1) Make sure the Anton base64 font is present in the DOM and registered
      const match = antonBase64CSS.match(/base64,([^)]+)\)/);
      if (match) {
        const font = new FontFace(
          'AntonBase64',
          `url(data:font/woff2;base64,${match[1]}) format('woff2')`,
          { weight: '400', style: 'normal' }
        );
        await font.load();
        document.fonts.add(font);
        await document.fonts.load('1em AntonBase64');
        await document.fonts.ready;

        styleEl = document.createElement('style');
        styleEl.textContent = antonBase64CSS;
        ref.current.prepend(styleEl);
      }

      // 2) Make the export node visible enough that iOS actually lays it out
      const el = ref.current;
      restoreStyles = {
        opacity: el.style.opacity,
        zIndex: el.style.zIndex,
        top: el.style.top,
      };
      el.style.top = '0';
      el.style.opacity = '1';
      el.style.zIndex = '-1'; // keep it non-interactive but in flow

      // 3) Wait for images, then inline them to data URLs (CRITICAL for iOS)
      await waitForImages(el);
      restoreImages = await inlineImages(el);

      // 4) Let layout settle fully
      await new Promise((r) => requestAnimationFrame(r));
      await sleep(120);

      // 5) Snapshot — use html2canvas on iOS, html-to-image elsewhere
      const isIOS =
        /iP(hone|ad|od)/.test(navigator.userAgent) ||
        (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 0);

      let dataUrl;

      try {
        if (isIOS) {
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
              // make sure lazy-loading doesn't stall
              doc
                .querySelectorAll('img[loading]')
                .forEach((n) => n.removeAttribute('loading'));
            },
          });
          dataUrl = canvas.toDataURL('image/png');
        } else {
          dataUrl = await toPng(el, {
            cacheBust: true,
            skipFonts: true, // font injected via <style>
            pixelRatio: options.pixelRatio ?? 2,
            backgroundColor: options.backgroundColor ?? '#111',
          });
        }
      } catch (err) {
        // fallback: flip the renderer if the primary fails
        console.warn(
          'Primary snapshot failed; trying alternate renderer:',
          err
        );
        try {
          const html2canvas = (
            await import('html2canvas/dist/html2canvas.esm.js')
          ).default;
          const canvas = await html2canvas(el, {
            backgroundColor: options.backgroundColor ?? '#111',
            scale: options.pixelRatio ?? 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
          });
          dataUrl = canvas.toDataURL('image/png');
        } catch {
          dataUrl = await toPng(el, {
            cacheBust: true,
            skipFonts: true,
            pixelRatio: options.pixelRatio ?? 2,
            backgroundColor: options.backgroundColor ?? '#111',
          });
        }
      }

      // 6) Download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      // Restore DOM
      if (restoreImages) restoreImages();
      if (restoreStyles && ref.current) {
        ref.current.style.opacity = restoreStyles.opacity;
        ref.current.style.zIndex = restoreStyles.zIndex;
        ref.current.style.top = restoreStyles.top;
      }
      if (styleEl) styleEl.remove();
    }
  };

  return download;
};

export default useImageDownload;
