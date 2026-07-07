import { renderToStaticMarkup } from "react-dom/server";
import { Phone } from "lucide-react";
import { describe, expect, it } from "vitest";
import { SingleSelectField } from "./SingleSelectField";

describe("SingleSelectField", () => {
    it("keeps long selected labels truncated with a full-text tooltip", () => {
        const longLabel =
            "Formulation longue de l item évalué qui doit rester lisible dans le champ sélectionné";

        const html = renderToStaticMarkup(
            <SingleSelectField
                options={[{ label: longLabel, value: "item-1" }]}
                value="item-1"
                placeholder="Choisir..."
                onChange={() => undefined}
            />,
        );

        expect(html).toContain(`title="${longLabel}"`);
        expect(html).toContain("relative w-full min-w-0 max-w-full");
        expect(html).toContain("max-w-full");
        expect(html).toContain("truncate");
        expect(html).toContain(longLabel);
    });

    it("renders option icons when provided", () => {
        const html = renderToStaticMarkup(
            <SingleSelectField
                options={[{ icon: Phone, label: "Téléphone", value: "phone" }]}
                value="phone"
                placeholder="Choisir..."
                onChange={() => undefined}
            />,
        );

        expect(html).toContain("lucide-phone");
        expect(html).toContain("Téléphone");
    });
});
