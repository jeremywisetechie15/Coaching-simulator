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

    it("disables only adding when the selection limit is reached", () => {
        const html = renderToStaticMarkup(
            <SearchableMultiSelectField
                addLabel="Ajouter"
                maxSelected={3}
                onAdd={() => undefined}
                onRemove={() => undefined}
                options={[
                    { label: "A", value: "a" },
                    { label: "B", value: "b" },
                    { label: "C", value: "c" },
                ]}
                searchPlaceholder="Rechercher..."
                selectedValues={["a", "b", "c"]}
            />,
        );

        expect(html.match(/disabled=""/g)).toHaveLength(1);
        expect(html).toContain("Ajouter");
    });
});
