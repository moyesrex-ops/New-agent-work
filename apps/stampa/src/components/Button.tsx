import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./ui.module.css";

type Variant = "primary" | "secondary" | "quiet" | "destructive";

const VARIANTS: Record<Variant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  quiet: styles.quiet,
  destructive: styles.destructive,
};

type Common = {
  variant?: Variant;
  block?: boolean;
  /** Console density. 40px instead of 56px (Phase 15.2). */
  compact?: boolean;
  children: ReactNode;
  /**
   * Required whenever `disabled` is set. Phase 15.1: a disabled button is
   * never shown without adjacent text saying what is missing — making it a
   * required prop turns that rule into a type error.
   */
  disabledReason?: string;
};

export type ButtonProps = Common &
  Omit<ComponentProps<"button">, "className" | "children"> &
  ({ disabled?: false } | { disabled: true; disabledReason: string });

function classes(variant: Variant, block?: boolean, compact?: boolean): string {
  return [styles.button, VARIANTS[variant], block && styles.block, compact && styles.compact]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  block,
  compact,
  children,
  disabledReason,
  ...rest
}: ButtonProps) {
  const button = (
    <button {...rest} className={classes(variant, block, compact)}>
      {children}
    </button>
  );

  if (!rest.disabled) return button;

  return (
    <div>
      {button}
      <span className={styles.disabledReason}>{disabledReason}</span>
    </div>
  );
}

export type ButtonLinkProps = Common &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

export function ButtonLink({
  variant = "primary",
  block,
  compact,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link {...rest} className={classes(variant, block, compact)}>
      {children}
    </Link>
  );
}
