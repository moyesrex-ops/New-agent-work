import { copy } from "@/lib/copy";
import shell from "@/components/shell.module.css";

export default function OfflinePage() {
  return (
    <div className={shell.supplier} style={{ paddingTop: "var(--space-12)" }}>
      <h1 className={shell.title}>{copy.offline.heading}</h1>
      <p className={shell.lede} style={{ marginTop: "var(--space-3)" }}>
        {copy.offline.body}
      </p>
    </div>
  );
}
