import { ListSkeleton, Skeleton } from "@/components/Surfaces";

/**
 * Shown between routes on the supplier app. The header and footer come from
 * the layout and stay put, so only the body flickers.
 *
 * This exists because the target device is a cheap Android on a bad network:
 * without it, tapping a link produces nothing at all for a second or more, and
 * the honest reading of nothing-at-all is that the tap did not register. The
 * shape is matched to a title plus a list of invoices, not a spinner.
 */
export default function Loading() {
  return (
    <div style={{ paddingTop: "var(--space-4)" }}>
      <Skeleton height={30} width="70%" />
      <div style={{ height: "var(--space-6)" }} />
      <ListSkeleton rows={3} />
    </div>
  );
}
