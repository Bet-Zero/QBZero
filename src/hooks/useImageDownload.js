import { toPng } from 'html-to-image';
import { antonBase64CSS } from '@/fonts/antonBase64';

type AnyEl = HTMLElement & { src?: string; currentSrc?: string; tagName?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Convert a URL (same-origin OK) to a data URL.
 */
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store', credentials: 'omit', mode: 'cors' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

/**
 * Inline <img> and CSS background images within root into data URLs.
 * Returns a restore() function to revert DOM after export.
 */
async function inlineImages(root: HTMLElement): Promise<() => void> {
  const restorers: Array<() => void> = [];

  // 1) Inline <img> nodes
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
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

      const actual = (img as any).currentSrc || img.src;
      if (!actual) return;

      try {
        const dataUrl = await urlToDataUrl(actual);
        img.setAttribute('crossorigin', 'anonymous');
        img.src = dataUrl;

        // give layout a tick, then ensure pixels are decoded
        await sleep(10);
        if ('decode' in img) {
          try { await (img as any).decode(); } catch {}
        }
      } catch {
        // If we can't inline, leave original. Same-origin should succeed though.
      }
    })
  );

  // 2) Inline CSS background-image URLs
  const all = Array.from(root.querySelectorAll<HTMLElement>('*'));
  await Promise.all(
    all.map(async (el) => {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundImage;
      if (!bg || bg === 'none') return;
      const m = bg.match(/url\(["']?(.*?)["']?\)/);
      const url = m?.[1];
      if (!url || url.startsWith('data:')) return;

      const prev = el.style.backgroundImage;
      restorers.push(() => {
        el.style.backgroundImage = prev;
      });

      try {
        const dataUrl = await urlToDataUrl(url);
        el.style.backgroundImage = `url("${dataUrl}")`;
      } catch {
        // ignore individual failures
      }
    })
  );

  // 3) Remove clip-path/mask from <img> only (rare iOS drop); border-radius is OK
  const masked = imgs.filter((img) => {
    const s = getComputedStyle(img);
    return s.clipPath !== 'none' || s.maskImage !== 'none';
  });
  masked.forEach((img) => {
    const prevClip = img.style.clipPath;
    const prevMask = (img.style as any).webkitMaskImage || img.style.maskImage;

    restorers.push(() => {
      img.style.clipPath = prevClip;
      (img.style as any).webkitMaskImage = prevMask;
      img.style.maskImage = prevMask;
    });

    img.style.clipPath = 'none';
    (img.style as any).webkitMaskImage = 'none';
    img.style.maskImage = 'none';
  });

  return () => restorers.reverse().forEach((fn) => fn());
}

/**
 * Ensure all <img> have fired load/error. (Useful when offscreen.)
 */
const waitForImages = async (root: HTMLElement | null) => {
  if (!root) return;
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
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

const useImageDownload = (ref: React.RefObject<HTMLElement>) => {
  const download = async (filename: string, options: { pixelRatio?: number; backgroundColor?: string } = {}) => {
    if (!ref.current) return;

    let styleEl: HTMLStyleElement | null = null;
    let restoreStyles: null | { opacity: string; zIndex: string; top: string } = null;
    let restoreImages: null | (() => void) = null;

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
        (document as any).fonts.add(font);
        await (document as any).fonts.load('1em AntonBase64');
        await (document as any).fonts.ready;

        styleEl = document.createElement('style');
        styleEl.textContent = antonBase64CSS;
        ref.current.prepend(styleEl);
      }

      // 2) Make the export node visible enough that iOS actually lays it out
      const el = ref.current as HTMLElement;
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

      // 5) Snapshot — iOS-safe (replace your toPng block with ALL of this)
      let dataUrl: string;

      // inline helper to detect iOS (includes iPad “Mac” with touch)
      const _isIOS = (() => {
        const ua = navigator.userAgent || '';
        const touchMac = /Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1;
        return /iP(hone|ad|od)/.test(ua) || touchMac;
      })();

      // TEMP: remove rounded corners on <img> (WebKit can drop rounded <img> in snapshots)
      const _imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
      const _prevRadii = _imgs.map(img => img.style.borderRadius);
      _imgs.forEach(img => { img.style.borderRadius = '0'; });

      try {
        if (_isIOS) {
          // iOS path → html2canvas (more reliable for <img>)
          const html2canvas = (await import('html2canvas')).default;
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
              // prevent lazy-loading from stalling
              doc.querySelectorAll('img[loading]').forEach(n => n.removeAttribute('loading'));
            },
          });
          dataUrl = canvas.toDataURL('image/png');
        } else {
          // non-iOS → keep html-to-image
          dataUrl = await toPng(el, {
            cacheBust: true,
            skipFonts: true, // font already injected via <style>
            pixelRatio: options.pixelRatio ?? 2,
            backgroundColor: options.backgroundColor ?? '#111',
          });
        }
      } catch (err) {
        console.warn('Primary export failed, trying alternate renderer:', err);
        // Fallback to the other renderer if the chosen one fails
        if (_isIOS) {
          dataUrl = await toPng(el, {
            cacheBust: true,
            skipFonts: true,
            pixelRatio: options.pixelRatio ?? 2,
            backgroundColor: options.backgroundColor ?? '#111',
          });
        } else {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(el, {
            backgroundColor: options.backgroundColor ?? '#111',
            scale: options.pixelRatio ?? 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            imageTimeout: 8000,
            windowWidth: el.scrollWidth,
            windowHeight: el.scrollHeight,
          });
          dataUrl = canvas.toDataURL('image/png');
        }
      } finally {
        // restore rounded corners
        _imgs.forEach((img, i) => { img.style.borderRadius = _prevRadii[i]; });
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
