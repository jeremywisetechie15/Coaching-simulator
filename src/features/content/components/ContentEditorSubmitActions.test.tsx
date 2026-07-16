import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContentEditorSubmitActions } from "./ContentEditorSubmitActions";

describe("ContentEditorSubmitActions", () => {
    it("offers distinct draft and publish submits for a draft", () => {
        const html = renderToStaticMarkup(
            <ContentEditorSubmitActions
                isDraft
                isPending={false}
                publishLabel="Publier le contenu"
                submitLabel="Enregistrer"
            />,
        );

        expect(html).toContain("Enregistrer le brouillon");
        expect(html).toContain("Publier le contenu");
        expect(html).toContain('value="save-draft"');
        expect(html).toContain('value="publish"');
    });

    it("keeps a single save submit for published content", () => {
        const html = renderToStaticMarkup(
            <ContentEditorSubmitActions
                isDraft={false}
                isPending={false}
                publishLabel="Publier le contenu"
                submitLabel="Enregistrer les modifications"
            />,
        );

        expect(html).toContain("Enregistrer les modifications");
        expect(html).not.toContain("Enregistrer le brouillon");
    });

    it("can block publication without disabling draft persistence", () => {
        const html = renderToStaticMarkup(
            <ContentEditorSubmitActions
                canSaveDraft
                canSubmit={false}
                isDraft
                isPending={false}
                publishLabel="Publier le contenu"
                submitLabel="Enregistrer"
            />,
        );

        expect(html).toContain('value="save-draft"');
        expect(html).toContain('value="publish" disabled=""');
        expect(html).not.toContain('value="save-draft" disabled=""');
    });
});
