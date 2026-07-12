import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DateRangeFilter } from "./DateRangeFilter";

describe("DateRangeFilter", () => {
    it("renders an inclusive date range with reciprocal input bounds", () => {
        const html = renderToStaticMarkup(
            <DateRangeFilter
                dateFrom="2026-06-01"
                dateTo="2026-06-30"
                onChange={() => undefined}
            />,
        );

        expect(html).toContain('aria-label="Date de début"');
        expect(html).toContain('max="2026-06-30"');
        expect(html).toContain('aria-label="Date de fin"');
        expect(html).toContain('min="2026-06-01"');
    });
});
