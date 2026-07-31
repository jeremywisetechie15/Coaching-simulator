import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PeopleCountTooltip } from "./PeopleCountTooltip";

describe("PeopleCountTooltip", () => {
    it("exposes the names on hover and keyboard focus", () => {
        const html = renderToStaticMarkup(
            <PeopleCountTooltip
                count={2}
                names={["Adrien Dupont", "Zoé Martin"]}
                pluralLabel="apprenants"
                singularLabel="apprenant"
            />,
        );

        expect(html).toContain("2 apprenants");
        expect(html).toContain("Adrien Dupont");
        expect(html).toContain("Zoé Martin");
        expect(html).toContain('tabindex="0"');
    });

    it("keeps an empty count non-interactive", () => {
        const html = renderToStaticMarkup(
            <PeopleCountTooltip
                count={0}
                names={[]}
                pluralLabel="membres"
                singularLabel="membre"
            />,
        );

        expect(html).toContain("0 membres");
        expect(html).not.toContain("tabindex");
    });
});
