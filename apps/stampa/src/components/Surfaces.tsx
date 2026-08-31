import Link from "next/link";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy";
import styles from "./ui.module.css";

/* ---------- Card / DocumentCard ---------- */

/**
 * `Card` is a container. `DocumentCard` represents paper: hairline border, no
 * shadow, because paper on a desk does not glow (Phase 15.3). Which of the two
 * a screen uses is a statement about what the thing on screen is.
 */
export function Card({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div className={styles.card} id={id}>
      {children}
    </div>
  );
}

export function DocumentCard({
  children,
  label,
  id,
}: {
  children: ReactNode;
  /** Announced as a region so a screen reader can summarise the document. */
  label?: string;
  id?: string;
}) {
  return (
    <section className={styles.documentCard} aria-label={label} id={id}>
      {children}
    </section>
  );
}

/* ---------- StatusChip ---------- */

export type Status =
  | "stamped"
  | "waiting"
  | "rejected"
  | "offline"
  | "draft"
  | "disputed"
  | "notInvited"
  | "invited"
  | "opened"
  | "live"
  | "stuck";

const CHIP_STYLE: Record<Status, string> = {
  stamped: styles.chipStamped,
  live: styles.chipStamped,
  waiting: styles.chipWaiting,
  invited: styles.chipWaiting,
  opened: styles.chipWaiting,
  rejected: styles.chipRejected,
  stuck: styles.chipRejected,
  offline: styles.chipOffline,
  draft: styles.chipDraft,
  notInvited: styles.chipDraft,
  disputed: styles.chipDisputed,
};

/**
 * Colour, dot and word together. Never colour alone — Phase 14.7 forbids
 * colour-only status, and a supplier in direct sunlight is the reason.
 */
export function StatusChip({ status }: { status: Status }) {
  return (
    <span className={[styles.chip, CHIP_STYLE[status]].join(" ")}>
      <span className={styles.chipDot} aria-hidden="true" />
      {copy.status[status]}
    </span>
  );
}

/* ---------- ListRow ---------- */

export function ListRow({
  href,
  title,
  amount,
  status,
  meta,
}: {
  href: string;
  title: string;
  amount?: string;
  status?: Status;
  meta?: string;
}) {
  return (
    <Link href={href} className={styles.listRow}>
      <span className={styles.listRowMain}>
        <span className={styles.listRowTitle}>{title}</span>
        <span className={styles.listRowSub}>
          {status ? <StatusChip status={status} /> : null}
          {meta ? <span className={styles.errorReassurance}> {meta}</span> : null}
        </span>
      </span>
      {amount ? <span className={styles.listRowAmount}>{amount}</span> : null}
    </Link>
  );
}

/* ---------- EmptyState ---------- */

/**
 * No illustration, ever (Phase 15.1).
 *
 * The heading is an h2, not an h1: an empty state is a section of a screen
 * that already has a title. The two places it is the whole screen supply their
 * own h1, and the browser walk fails any page that ends up with none.
 */
export function EmptyState({
  heading,
  body,
  action,
}: {
  heading: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <h2 className={styles.emptyHeading}>{heading}</h2>
      {body ? <p className={styles.emptyBody}>{body}</p> : null}
      {action}
    </div>
  );
}

/* ---------- ErrorState ---------- */

/**
 * What / why / next, then the reassurance line. `action` is required, so an
 * error screen with no way forward will not compile. That is ticket F-04's
 * "a dead end will not compile".
 *
 * `what` is the h1. An error state is always the entire screen, and a
 * rejection with no heading leaves a screen-reader user with a status chip and
 * three paragraphs of prose to orient in.
 */
export function ErrorState({
  status,
  what,
  why,
  offendingValue,
  next,
  reassurance,
  action,
}: {
  status: Status;
  what: string;
  why: string;
  offendingValue?: string;
  next?: string;
  reassurance?: string;
  action: ReactNode;
}) {
  return (
    <div className={styles.errorState} role="alert">
      <StatusChip status={status} />
      <h1 className={styles.errorWhat}>{what}</h1>
      <p className={styles.errorWhy}>
        {why}
        {offendingValue ? (
          <>
            {" "}
            <span className={styles.errorValue}>{offendingValue}</span>
          </>
        ) : null}
      </p>
      {next ? <p className={styles.errorWhy}>{next}</p> : null}
      {reassurance ? <p className={styles.errorReassurance}>{reassurance}</p> : null}
      <div>{action}</div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

/** Matched to the shape of the real content. Never a spinner over a blank page. */
export function Skeleton({ height, width = "100%" }: { height: number; width?: string }) {
  return <div className={styles.skeleton} style={{ height, width }} aria-hidden="true" />;
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} style={{ padding: "var(--space-4) 0" }}>
          <Skeleton height={16} width="55%" />
          <div style={{ height: "var(--space-2)" }} />
          <Skeleton height={12} width="30%" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Banner ---------- */

export function Banner({
  tone = "neutral",
  children,
  action,
}: {
  tone?: "neutral" | "warning" | "danger";
  children: ReactNode;
  action?: ReactNode;
}) {
  const toneStyle = {
    neutral: styles.bannerNeutral,
    warning: styles.bannerWarning,
    danger: styles.bannerDanger,
  }[tone];

  return (
    <div className={[styles.banner, toneStyle].join(" ")} role="status">
      <span>{children}</span>
      {action ? <span className={styles.bannerAction}>{action}</span> : null}
    </div>
  );
}

/* ---------- DataTable ---------- */

export type Column<Row> = {
  key: string;
  header: string;
  numeric?: boolean;
  render: (row: Row) => ReactNode;
};

/**
 * Console only. Virtualisation past 200 rows is ticket B-04; until then the
 * table caps what it renders and says so rather than freezing a laptop.
 */
export function DataTable<Row>({
  columns,
  rows,
  caption,
  limit = 200,
  empty,
}: {
  columns: Column<Row>[];
  rows: Row[];
  caption?: string;
  limit?: number;
  empty: ReactNode;
}) {
  if (!rows.length) return <>{empty}</>;

  const visible = rows.slice(0, limit);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        {caption ? <caption className="visually-hidden">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.numeric ? styles.numeric : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key} className={column.numeric ? styles.numeric : undefined}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > visible.length ? (
        <p className={styles.tableCaption}>
          {copy.table.truncated(visible.length, rows.length)}
        </p>
      ) : null}
    </div>
  );
}
