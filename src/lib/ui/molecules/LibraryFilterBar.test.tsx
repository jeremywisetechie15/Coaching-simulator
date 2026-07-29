import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LibraryFilterBar, LibrarySearchField } from "./LibraryFilterBar";

describe("LibraryFilterBar", () => {
    it("shares the library surface and search field structure", () => {
        const html = renderToStaticMarkup(
            <LibraryFilterBar>
                <LibrarySearchField
                    ariaLabel="Rechercher une méthode"
                    onChange={vi.fn()}
                    placeholder="Rechercher une méthode..."
                    value=""
                />
            </LibraryFilterBar>,
        );

        expect(html).toContain('aria-label="Rechercher une méthode"');
        expect(html).toContain('placeholder="Rechercher une méthode..."');
        expect(html).toContain('type="search"');
    });
});
