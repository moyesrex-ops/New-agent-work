import { ListSkeleton, Skeleton } from "@/components/Surfaces";

/** Console routes are table-shaped, so the skeleton is too. */
export default function Loading() {
  return (
    <div style={{ paddingTop: "var(--space-4)" }}>
      <Skeleton height={26} width="34%" />
      <div style={{ height: "var(--space-6)" }} />
      <ListSkeleton rows={6} />
    </div>
  );
}
