import { toPng } from 'html-to-image';
import { antonBase64CSS } from '@/fonts/antonBase64';
import { withDataUrlImages, forceImageLoad } from '@/utils/imagePreloader';

const waitForImages = async (root) => {
  if (!root) return;

  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth !== 0) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const handleDone = () => {
          img.removeEventListener('load', handleDone);
          img.removeEventListener('error', handleDone);
          resolve();
        };

        img.addEventListener('load', handleDone, { once: true });
        img.addEventListener('error', handleDone, { once: true });
      });
    })
  );
};

const useImageDownload = (ref) => {
  const download = async (filename, options = {}) => {
    if (!ref.current) return;
    let styleEl;
    let originalStyles = null;
    try {
      // 1. Ensure the Base64 font is loaded and injected before export
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

        // Inject @font-face so html-to-image clone retains the font
        styleEl = document.createElement('style');
        styleEl.textContent = antonBase64CSS;
        ref.current.prepend(styleEl);
      }

      // 2. Force image loading by temporarily bringing container into viewport
      // This addresses mobile browser optimizations that skip loading images in off-screen elements
      const element = ref.current;
      originalStyles = {
        opacity: element.style.opacity,
        zIndex: element.style.zIndex,
        top: element.style.top
      };
      
      // Force images to load by temporarily making element "visible" to mobile browsers
      await forceImageLoad(element, 300);

      // 3. Ensure all images are fully loaded
      await waitForImages(element);

      // 4. Convert images to data URLs and capture with those data URLs
      // This ensures mobile browsers have the actual image data in memory during capture
      const dataUrl = await withDataUrlImages(element, async () => {
        // Wait for data URLs to be applied
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => setTimeout(r, 100));

        // 5. Export as PNG using the element directly
        return await toPng(element, {
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
