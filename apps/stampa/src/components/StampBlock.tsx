import { Mark } from "./Logo";
import styles from "./ui.module.css";

/**
 * The signature object (Phase 15.1). It is the reason a supplier screenshots
 * the screen, and the reason the next supplier trusts the link.
 *
 * `pressed` runs the press animation once. `prefers-reduced-motion` is handled
 * globally in globals.css, which shows the settled state directly rather than
 * animating faster.
 */
export function StampBlock({
  irn,
  stampedAt,
  pressed = false,
}: {
  irn: string;
  stampedAt: string;
  pressed?: boolean;
}) {
  return (
    <div className={[styles.stampBlock, pressed && styles.stampPressed].filter(Boolean).join(" ")}>
      <Mark size={40} />
      <span>
        <span className={styles.stampWord}>STAMPED</span>
        <span className={styles.stampMeta} style={{ display: "block" }}>
          {irn}
        </span>
        <span className={styles.stampTime} style={{ display: "block" }}>
          {stampedAt}
        </span>
      </span>
    </div>
  );
}
