"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import styles from "./ui.module.css";

/**
 * S11 offline banner (ticket S-09).
 *
 * It renders nothing until the browser says it is offline, so it costs one
 * small client component and no layout shift. The words matter more than the
 * mechanism: a supplier on a danfo needs to be told the work is safe, not that
 * a request failed.
 *
 * Deliberately not a service worker. Nothing is queued in the browser, because
 * an invoice is persisted server-side before any transmission is attempted and
 * the retry worker owns it from there — the client has nothing to hold.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className={[styles.banner, styles.bannerWarning, styles.offlineBanner].join(" ")} role="status">
      {copy.offline.banner}
    </div>
  );
}
