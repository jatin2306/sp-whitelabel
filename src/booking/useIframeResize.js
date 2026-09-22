import { useEffect } from 'react';

export function useIframeResize(deps = []) {
  useEffect(() => {
    const notify = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight
      );
      window.parent.postMessage(
        { source: 'sp-whitelabel', type: 'resize', height },
        '*'
      );
    };

    notify();
    window.addEventListener('resize', notify);

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(notify);
      observer.observe(document.body);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', notify);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
