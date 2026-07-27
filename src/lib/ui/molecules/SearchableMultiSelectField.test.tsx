import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SearchableMultiSelectField } from "./SearchableMultiSelectField";

describe("SearchableMultiSelectField", () => {
    it("disables both adding and removing values when locked", () => {
        const html = renderToStaticMarkup(
            <SearchableMultiSelectField
                addLabel="Ajouter"
                disabled
                onAdd={() => undefined}
                onRemove={() => undefined}
                options={[{ label: "Prospection", value: "prospection" }]}
                searchPlaceholder="Rechercher..."
                selectedValues={["prospection"]}
            />,
        );

        expect(html.match(/disabled=""/g)).toHaveLength(2);
        expect(html).toContain("Prospection");
    });
});
