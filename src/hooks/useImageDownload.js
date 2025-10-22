// useImageDownload.js — mobile-safe export (inline + mirror-imgs + iOS fallback)
import { toPng } from 'html-to-image';
import { antonBase64CSS } from '@/fonts/antonBase64';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

      if (prevSrcSet) img.removeAttribute('srcset');

      const actual = img.currentSrc || img.src;
      if (!actual) return;

      try {
        const dataUrl = await urlToDataUrl(actual);
        img.setAttribute('crossorigin', 'anonymous');
        img.src = dataUrl;

        await sleep(10);
        if (img.decode) {
          try {
            await img.decode();
          } catch {}
        }
      } catch {
        // leave as-is if inlining fails
      }
    })
  );

  // 2) Inline CSS background-image URLs
  const all = Array.from(root.querySelectorAll('*'));
  await Promise.all(
    all.map(async (el) => {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundImage;
      if (!bg || bg === 'none') return;
      const m = bg.match(/url\(["']?(.*?)["']?\)/);
      const url = m && m[1];
      if (!url || url.startsWith('data:')) return;

      const prev = el.style.backgroundImage;
      restorers.push(() => {
        el.style.backgroundImage = prev;
      });

      try {
        const dataUrl = await urlToDataUrl(url);
        el.style.backgroundImage = `url("${dataUrl}")`;
      } catch {}
    })
  );

  // 3) Remove clip-path/mask on <img> (rare iOS drop); border-radius is fine
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

// Mirror <img> headshots to parent backgrounds (iOS paints bg reliably)
// Mirror <img> headshots onto parent as an ADDITIONAL background (preserve existing logo bg)
function mirrorImgsToBackground(root) {
  const entries = [];
  const imgs = Array.from(root.querySelectorAll('img'));

  imgs.forEach((img) => {
    const parent = img.parentElement;
    const src = img.currentSrc || img.src;
    if (!parent || !src) return;

    // Read the *computed* background so we don't clobber logo styles
    const cs = getComputedStyle(parent);
    const prevInline = {
      image: parent.style.backgroundImage,
      size: parent.style.backgroundSize,
      position: parent.style.backgroundPosition,
      repeat: parent.style.backgroundRepeat,
    };

    // Existing (possibly class-applied) values
    const existingImage =
      cs.backgroundImage && cs.backgroundImage !== 'none'
        ? cs.backgroundImage
        : null;
    const existingSize = cs.backgroundSize || 'auto';
    const existingPos = cs.backgroundPosition || '0% 0%';
    const existingRepeat = cs.backgroundRepeat || 'repeat';

    // Build layered backgrounds: keep existing logo first, add headshot on top
    const newImage = existingImage
      ? `${existingImage}, url("${src}")`
      : `url("${src}")`;
    const newSize = existingImage ? `${existingSize}, cover` : `cover`;
    const newPos = existingImage ? `${existingPos}, 50% 50%` : `50% 50%`;
    const newRepeat = existingImage
      ? `${existingRepeat}, no-repeat`
      : `no-repeat`;

    // Apply layered backgrounds
    parent.style.backgroundImage = newImage;
    parent.style.backgroundSize = newSize;
    parent.style.backgroundPosition = newPos;
    parent.style.backgroundRepeat = newRepeat;

    // Hide the <img> just for the snapshot (we're painting it as bg)
    const prevVis = img.style.visibility;
    img.style.visibility = 'hidden';

    entries.push({ parent, img, prevInline, prevVis });
  });

  // Restore function
  return () => {
    entries.forEach(({ parent, img, prevInline, prevVis }) => {
      parent.style.backgroundImage = prevInline.image;
      parent.style.backgroundSize = prevInline.size;
      parent.style.backgroundPosition = prevInline.position;
      parent.style.backgroundRepeat = prevInline.repeat;
      img.style.visibility = prevVis;
    });
  };
}

const useImageDownload = (ref) => {
  const download = async (filename, options = {}) => {
    if (!ref.current) return;

    let styleEl = null;
    let restoreStyles = null;
    let restoreImages = null;
    let restoreMirror = null;

    try {
      // 1) Ensure Anton base64 font is registered + available to clones
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

      // 2) Make the export node visible enough for iOS layout
      const el = ref.current;
      restoreStyles = {
        opacity: el.style.opacity,
        zIndex: el.style.zIndex,
        top: el.style.top,
      };
      el.style.top = '0';
      el.style.opacity = '1';
      el.style.zIndex = '-1';

      // 3) Wait for images → inline to data URLs
      await waitForImages(el);
      restoreImages = await inlineImages(el);

      // 4) Mirror imgs to parent backgrounds (rock-solid on iOS)
      restoreMirror = mirrorImgsToBackground(el);

      // 5) Settle layout
      await new Promise((r) => requestAnimationFrame(r));
      await sleep(120);

      // 6) Snapshot (prefer html2canvas here)
      let dataUrl;

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
          imageTimeout: 8000,
          windowWidth: el.scrollWidth,
          windowHeight: el.scrollHeight,
          onclone: (doc) => {
            doc
              .querySelectorAll('img[loading]')
              .forEach((n) => n.removeAttribute('loading'));
          },
        });
        dataUrl = canvas.toDataURL('image/png');
      } catch (err) {
        // Fallback to html-to-image if html2canvas trips
        console.warn('html2canvas failed, trying html-to-image:', err);
        dataUrl = await toPng(el, {
          cacheBust: true,
          skipFonts: true,
          pixelRatio: options.pixelRatio ?? 2,
          backgroundColor: options.backgroundColor ?? '#111',
        });
      }

      // 7) Download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      // Restore DOM
      if (restoreMirror) restoreMirror();
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
