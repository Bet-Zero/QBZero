/**
 * Utility for preloading images and converting them to data URLs
 * This is specifically designed to handle mobile browser image loading issues
 * where images in off-screen or hidden elements may not load properly
 */

/**
 * Converts an image URL to a data URL by fetching and converting to base64
 * @param {string} url - The image URL to convert
 * @returns {Promise<string>} The data URL
 */
export const imageUrlToDataUrl = async (url) => {
  try {
    // Handle relative URLs
    const absoluteUrl = url.startsWith('http') || url.startsWith('data:')
      ? url
      : new URL(url, window.location.origin).href;

    // If already a data URL, return as-is
    if (absoluteUrl.startsWith('data:')) {
      return absoluteUrl;
    }

    const response = await fetch(absoluteUrl, {
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Failed to convert image to data URL: ${url}`, error);
    return url; // Return original URL as fallback
  }
};

/**
 * Preloads all images in a container and converts them to data URLs
 * @param {HTMLElement} container - The container element with images
 * @returns {Promise<Map<HTMLImageElement, string>>} Map of image elements to their data URLs
 */
export const preloadImages = async (container) => {
  if (!container) return new Map();

  const images = Array.from(container.querySelectorAll('img'));
  const imageDataMap = new Map();

  await Promise.all(
    images.map(async (img) => {
      try {
        // Wait for image to be loaded first if it's still loading
        if (!img.complete) {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Image load timeout'));
            }, 10000);

            const handleLoad = () => {
              clearTimeout(timeout);
              img.removeEventListener('load', handleLoad);
              img.removeEventListener('error', handleError);
              resolve();
            };

            const handleError = () => {
              clearTimeout(timeout);
              img.removeEventListener('load', handleLoad);
              img.removeEventListener('error', handleError);
              resolve(); // Resolve anyway to not block other images
            };

            img.addEventListener('load', handleLoad);
            img.addEventListener('error', handleError);
          });
        }

        // Convert to data URL
        const dataUrl = await imageUrlToDataUrl(img.src);
        imageDataMap.set(img, dataUrl);
      } catch (error) {
        console.warn('Failed to preload image:', img.src, error);
        // Still add to map with original src as fallback
        imageDataMap.set(img, img.src);
      }
    })
  );

  return imageDataMap;
};

/**
 * Temporarily replaces image src attributes with data URLs, calls a function, then restores
 * @param {HTMLElement} container - The container element with images
 * @param {Function} fn - The function to call with data URLs applied
 * @returns {Promise<any>} The result of the function
 */
export const withDataUrlImages = async (container, fn) => {
  if (!container) return fn();

  // Preload all images and get data URLs
  const imageDataMap = await preloadImages(container);

  // Store original src values
  const originalSrcs = new Map();
  imageDataMap.forEach((dataUrl, img) => {
    originalSrcs.set(img, img.src);
    img.src = dataUrl;
  });

  try {
    // Wait for browser to process the new src values
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 100));

    // Call the function with data URLs in place
    return await fn();
  } finally {
    // Restore original src values
    originalSrcs.forEach((originalSrc, img) => {
      img.src = originalSrc;
    });
  }
};

/**
 * Forces images to load by temporarily bringing the container into viewport
 * @param {HTMLElement} container - The container element
 * @param {number} duration - How long to keep in viewport (ms)
 * @returns {Promise<void>}
 */
export const forceImageLoad = async (container, duration = 100) => {
  if (!container) return;

  // Save original styles
  const originalTop = container.style.top;
  const originalOpacity = container.style.opacity;
  const originalZIndex = container.style.zIndex;
  const originalPointerEvents = container.style.pointerEvents;

  try {
    // Bring into viewport but keep behind everything and non-interactive
    container.style.top = '0';
    container.style.opacity = '0.01'; // Barely visible but not 0
    container.style.zIndex = '-9999';
    container.style.pointerEvents = 'none';

    // Wait for images to be discovered and start loading
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, duration));

    // Get all images and wait for them to complete
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth !== 0) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          const timeout = setTimeout(resolve, 5000); // Don't wait forever
          
          const handleDone = () => {
            clearTimeout(timeout);
            img.removeEventListener('load', handleDone);
            img.removeEventListener('error', handleDone);
            resolve();
          };

          img.addEventListener('load', handleDone);
          img.addEventListener('error', handleDone);
        });
      })
    );
  } finally {
    // Restore original position
    container.style.top = originalTop;
    container.style.opacity = originalOpacity;
    container.style.zIndex = originalZIndex;
    container.style.pointerEvents = originalPointerEvents;
  }
};
