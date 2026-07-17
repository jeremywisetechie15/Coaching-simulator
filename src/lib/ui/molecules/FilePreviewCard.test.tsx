import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FilePreviewCard } from "./FilePreviewCard";

describe("FilePreviewCard", () => {
    it("uses the provided modal action instead of opening video in a new tab", () => {
        const html = renderToStaticMarkup(
            <FilePreviewCard
                href="/api/evaluations/quiz-1/attachments/video-1"
                kind="video"
                onAction={() => undefined}
                title="Vidéo de la question"
            />,
        );

        expect(html).toContain('aria-haspopup="dialog"');
        expect(html).toContain("Lire");
        expect(html).not.toContain("target=\"_blank\"");
        expect(html).not.toContain("<video");
    });
});
