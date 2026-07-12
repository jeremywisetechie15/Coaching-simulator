import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Edit3 } from "lucide-react";
import { CardActionMenu, CardActionMenuLink } from "./CardActionMenu";

describe("CardActionMenu", () => {
    it("keeps action icons and labels left-aligned inside centered cards", () => {
        const html = renderToStaticMarkup(
            <CardActionMenu>
                <CardActionMenuLink href="/edit" icon={Edit3} label="Modifier" />
            </CardActionMenu>,
        );

        expect(html).toContain("justify-start");
        expect(html).toContain("gap-2");
        expect(html).toContain("text-left");
    });
});
