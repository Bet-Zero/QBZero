import { lazy } from 'react';

const RELOAD_FLAG = 'qbzero:chunk-reload';

/**
 * React.lazy for a route's page, with one recovery step.
 *
 * Each page now ships as its own file named by content hash. A tab left open
 * across a deploy still holds the old index, so its next navigation asks for a
 * page file that no longer exists and the import rejects. Reloading once picks
 * up the new index; the session flag stops a genuinely broken page from
 * reloading forever, and is cleared on the next page that loads.
 */
const lazyPage = (load) =>
  lazy(() =>
    load().then(
      (module) => {
        try {
          sessionStorage.removeItem(RELOAD_FLAG);
        } catch {
          // Storage can be blocked; the page still loads.
        }
        return module;
      },
      (error) => {
        let alreadyReloaded = true;
        try {
          alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
          if (!alreadyReloaded) sessionStorage.setItem(RELOAD_FLAG, '1');
        } catch {
          // Without storage there is no way to tell a retry from a loop.
        }
        if (alreadyReloaded) throw error;
        window.location.reload();
        // Hold the Suspense fallback while the reload takes over.
        return new Promise(() => {});
      }
    )
  );

export default lazyPage;
