import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrganizationsFilterBar } from "./OrganizationsFilterBar";

describe("OrganizationsFilterBar", () => {
    it("renders the controlled organization status filter", () => {
        const html = renderToStaticMarkup(
            <OrganizationsFilterBar
                onSearchQueryChange={() => undefined}
                onStatusFilterChange={() => undefined}
                searchQuery="Acme"
                statusFilter="suspended"
            />,
        );

        expect(html).toContain('aria-label="Filtrer les organisations par statut"');
        expect(html).toContain("Désactivé");
        expect(html).toContain('value="Acme"');
    });
});
