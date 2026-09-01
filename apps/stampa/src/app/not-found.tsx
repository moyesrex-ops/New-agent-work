import Link from "next/link";
import { copy, BRAND } from "@/lib/copy";
import shell from "@/components/shell.module.css";

/** F-03: error pages in brand voice, not framework defaults. */
export default function NotFound() {
  return (
    <div className={shell.supplier} style={{ paddingTop: "var(--space-12)" }}>
      <h1 className={shell.title}>{copy.errors.notFoundHeading}</h1>
      <p className={shell.lede} style={{ marginTop: "var(--space-3)" }}>
        {copy.errors.notFoundBody}
      </p>
      <p style={{ marginTop: "var(--space-6)" }}>
        <Link href="/s">{copy.errors.notFoundCta}</Link>
      </p>
      <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
        {BRAND.supportPhone}
      </p>
    </div>
  );
}
