import { Banner } from "@/components/Surfaces";
import { copy } from "@/lib/copy";

/**
 * Reads the raw flag so a marketing render cannot throw the boot contract.
 * Instrumentation still refuses a bad production environment at process start.
 */
export function HoldNotice() {
  if (process.env.STAMPA_GATEWAY !== "hold") return null;
  return <Banner tone="warning">{copy.hold.banner}</Banner>;
}
