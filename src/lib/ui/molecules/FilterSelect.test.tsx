import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FilterSelect } from "./FilterSelect";

describe("FilterSelect", () => {
    it("renders the selected option label and its accessible name", () => {
        const html = renderToStaticMarkup(
            <FilterSelect
                ariaLabel="Filtrer par période"
                onChange={() => undefined}
                options={[
                    { label: "Toutes les périodes", value: "all" },
                    { label: "30 derniers jours", value: "30d" },
                ]}
                value="30d"
            />,
        );

        expect(html).toContain('aria-label="Filtrer par période"');
        expect(html).toContain("30 derniers jours");
    });
});
