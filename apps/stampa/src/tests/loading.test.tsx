import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BuyerLoading from "@/app/c/loading";
import OperatorLoading from "@/app/ops/loading";
import SupplierLoading from "@/app/s/loading";
import { copy } from "@/lib/copy";

/**
 * Next wires these by filename, so the risk is not that the convention breaks
 * — it is that somebody deletes the file, or that the skeleton renders as a
 * silent decoration a screen reader never mentions.
 */
describe("Route loading states", () => {
  const surfaces = [
    ["supplier", SupplierLoading],
    ["buyer console", BuyerLoading],
    ["operator console", OperatorLoading],
  ] as const;

  for (const [name, Loading] of surfaces) {
    describe(`Given the ${name} is waiting for a route`, () => {
      const html = renderToStaticMarkup(<Loading />);

      it("Then the wait is announced rather than shown only in pixels", () => {
        expect(html).toContain('aria-busy="true"');
        expect(html).toContain('aria-live="polite"');
        expect(html).toContain(copy.a11y.loading);
      });

      it("Then the placeholder blocks are hidden from screen readers", () => {
        // Otherwise the live region's one word is followed by a dozen empty
        // divs, which is worse than saying nothing.
        expect(html).toContain('aria-hidden="true"');
      });

      it("Then it has the shape of the content it stands in for", () => {
        // A spinner is a promise that something is happening. A skeleton is a
        // promise about what is about to appear, which is the one this
        // product makes everywhere else.
        expect(html.match(/aria-hidden="true"/g)?.length ?? 0).toBeGreaterThan(2);
      });
    });
  }
});
