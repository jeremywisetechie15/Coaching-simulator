import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContentResourcesModal } from "./ContentResourcesModal";

describe("ContentResourcesModal", () => {
    it("uses a dialog action for video resources", () => {
        const html = renderToStaticMarkup(
            <ContentResourcesModal
                description="Ressources"
                documents={[
                    {
                        id: "video-1",
                        kind: "video",
                        title: "Vidéo de préparation",
                        url: "https://youtu.be/dQw4w9WgXcQ",
                    },
                ]}
                emptyMessage="Aucune ressource"
                onClose={() => undefined}
                title="Documents"
            />,
        );

        expect(html).toContain('aria-haspopup="dialog"');
        expect(html).toContain("Lire");
        expect(html).not.toContain('href="https://youtu.be/dQw4w9WgXcQ"');
    });
});
