"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./ui.module.css";

/**
 * Bottom sheet on mobile, centred dialog on desktop (Phase 15.1). Built on the
 * native dialog element so focus trapping, Escape and the top layer come from
 * the platform rather than from a library we would have to keep accessible.
 */
export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={styles.scrim}
      style={{ border: "none", padding: 0, maxWidth: "100%", maxHeight: "100%" }}
    >
      <div className={styles.sheet}>{children}</div>
    </dialog>
  );
}
