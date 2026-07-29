import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";
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

    it("applies the compact library appearance without changing the default variant", () => {
        const html = renderToStaticMarkup(
            <FilterSelect
                appearance="library"
                ariaLabel="Filtrer par domaine"
                onChange={() => undefined}
                options={["Tous les domaines", "Commercial"]}
                value="Tous les domaines"
            />,
        );

        expect(html).toContain(uiTokens.filterSelect.triggerAppearance.library);
        expect(html).not.toContain(uiTokens.filterSelect.triggerAppearance.default);
    });
});
