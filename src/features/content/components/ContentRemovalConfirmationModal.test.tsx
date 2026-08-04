import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { ContentRemovalConfirmationModal } from "./ContentRemovalConfirmationModal";

describe("ContentRemovalConfirmationModal", () => {
    it("uses the permanent deletion confirmation for a draft", () => {
        const html = renderToStaticMarkup(
            <ContentRemovalConfirmationModal
                busy={false}
                entityLabel="la méthode"
                name="Méthode test"
                onCancel={vi.fn()}
                onConfirm={vi.fn()}
                status={CONTENT_STATUS.draft}
            />,
        );

        expect(html).toContain("Supprimer la méthode");
        expect(html).toContain("suppression est définitive");
        expect(html).not.toContain("Archiver");
    });

    it("uses the archive confirmation for published content", () => {
        const html = renderToStaticMarkup(
            <ContentRemovalConfirmationModal
                busy={false}
                entityLabel="la méthode"
                name="Méthode test"
                onCancel={vi.fn()}
                onConfirm={vi.fn()}
                status={CONTENT_STATUS.published}
            />,
        );

        expect(html).toContain("Archiver la méthode");
        expect(html).toContain("Méthode test");
        expect(html).not.toContain("suppression est définitive");
    });
});
