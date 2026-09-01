import Link from "next/link";
import { connection } from "next/server";
import { isDemo } from "@/lib/env";
import { copy } from "@/lib/copy";
import { Banner } from "./Surfaces";
import shell from "./shell.module.css";

/** Permanent warning on a public demo, with a way back to the door page. */
export async function DemoBanner() {
  await connection();
  if (!isDemo()) return null;
  return (
    <Banner
      tone="warning"
      action={
        <Link href="/" className={shell.textLink}>
          {copy.demo.home}
        </Link>
      }
    >
      {copy.demo.banner}
    </Banner>
  );
}
