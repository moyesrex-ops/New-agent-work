import { ListSkeleton, Skeleton } from "@/components/Surfaces";

/** Same shape as the buyer console: the operator screens are tables too. */
export default function Loading() {
  return (
    <div style={{ paddingTop: "var(--space-4)" }}>
      <Skeleton height={26} width="34%" />
      <div style={{ height: "var(--space-6)" }} />
      <ListSkeleton rows={6} />
    </div>
  );
}
