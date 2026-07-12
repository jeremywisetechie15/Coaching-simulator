import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FieldLabel } from "./FieldLabel";

describe("FieldLabel", () => {
    it("renders the shared required indicator with accessible context", () => {
        const html = renderToStaticMarkup(
            <FieldLabel htmlFor="name" required>Nom</FieldLabel>,
        );

        expect(html).toContain('for="name"');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain("*");
        expect(html).toContain("(obligatoire)");
    });

    it("does not mark optional fields", () => {
        const html = renderToStaticMarkup(<FieldLabel htmlFor="note">Note</FieldLabel>);

        expect(html).not.toContain("(obligatoire)");
        expect(html).not.toContain("*");
    });
});
