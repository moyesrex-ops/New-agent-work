import { copy, BRAND } from "@/lib/copy";
import shell from "@/components/shell.module.css";

export default function Goodbye() {
  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.account.deleted}</h1>
      <p className={shell.note}>
        If you need your stamped invoices later, call {BRAND.supportPhone}.
      </p>
    </div>
  );
}
