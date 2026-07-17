import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Drawer } from "./Drawer";

describe("Drawer", () => {
    it("associates its accessible title and description with the dialog", () => {
        const html = renderToStaticMarkup(
            <Drawer
                description="Description du panneau"
                id="drawer-test"
                onClose={() => undefined}
                title="Titre du panneau"
            >
                Contenu
            </Drawer>,
        );

        expect(html).toContain("id=\"drawer-test\"");
        expect(html).toContain("role=\"dialog\"");
        expect(html).toContain("aria-modal=\"true\"");
        expect(html).toContain("aria-labelledby=");
        expect(html).toContain("aria-describedby=");
        expect(html).toContain("Titre du panneau");
        expect(html).toContain("Description du panneau");
    });
});
