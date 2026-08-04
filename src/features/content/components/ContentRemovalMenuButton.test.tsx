import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { ContentRemovalMenuButton } from "./ContentRemovalMenuButton";

describe("ContentRemovalMenuButton", () => {
    it("offers permanent deletion for a draft", () => {
        const html = renderToStaticMarkup(
            <ContentRemovalMenuButton
                onClick={vi.fn()}
                status={CONTENT_STATUS.draft}
            />,
        );

        expect(html).toContain("Supprimer");
        expect(html).not.toContain("Archiver");
    });

    it("offers archiving for published content", () => {
        const html = renderToStaticMarkup(
            <ContentRemovalMenuButton
                onClick={vi.fn()}
                status={CONTENT_STATUS.published}
            />,
        );

        expect(html).toContain("Archiver");
        expect(html).not.toContain("Supprimer");
    });

    it("does not offer another removal action for archived content", () => {
        const html = renderToStaticMarkup(
            <ContentRemovalMenuButton
                onClick={vi.fn()}
                status={CONTENT_STATUS.archived}
            />,
        );

        expect(html).toBe("");
    });
});
