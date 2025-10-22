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
    let styleEl;
    let originalStyles = null;
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

      // 2. Temporarily make the container fully visible for mobile browsers
      // Mobile browsers are more aggressive about not loading images in hidden/scaled elements
      const element = ref.current;
      originalStyles = {
        opacity: element.style.opacity,
        zIndex: element.style.zIndex,
        top: element.style.top
      };
      
      // Bring element into viewport and make visible (but keep it non-interactive and below other content)
      element.style.top = '0';
      element.style.opacity = '1';
      element.style.zIndex = '-1';

      // 3. Ensure all images are fully loaded before rendering
      await waitForImages(ref.current);

      // 4. Wait for layout to settle and images to fully render
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 300)); // Increased delay for mobile

      // 5. Export as PNG using the element directly
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        // Avoid html-to-image font parsing bugs by skipping font
        // inlining. Fonts are already loaded via Base64.
        skipFonts: true,
        pixelRatio: options.pixelRatio || 2,
        backgroundColor: options.backgroundColor || '#111',
        filter: (node) => {
          // Don't filter out images even if they have failed to load
          if (node.tagName === 'IMG') {
            return true;
          }
          return true;
        },
        // Try to embed external SVGs
        async beforeDrawImage(node) {
          if (node.tagName === 'IMG' && node.src.endsWith('.svg')) {
            try {
              const response = await fetch(node.src);
              const svgText = await response.text();
              const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;
              node.src = svgDataUrl;
            } catch (err) {
              console.warn('Failed to embed SVG:', err);
            }
          }
          return node;
        },
      });

      // 6. Download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      // Restore original styles
      if (originalStyles && ref.current) {
        ref.current.style.opacity = originalStyles.opacity;
        ref.current.style.zIndex = originalStyles.zIndex;
        ref.current.style.top = originalStyles.top;
      }
      if (styleEl) {
        styleEl.remove();
      }
    }
  };

  return download;
};

export default useImageDownload;
