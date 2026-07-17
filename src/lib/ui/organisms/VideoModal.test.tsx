import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VideoModal } from "./VideoModal";

describe("VideoModal", () => {
    it("renders an uploaded video inside the shared dialog", () => {
        const html = renderToStaticMarkup(
            <VideoModal
                description="Vidéo de préparation"
                onClose={() => undefined}
                title="Découvrir la méthode"
                url="/api/methods/method-1/resources/resource-1"
            />,
        );

        expect(html).toContain('role="dialog"');
        expect(html).toContain("Découvrir la méthode");
        expect(html).toContain("Vidéo de préparation");
        expect(html).toContain("<video");
    });
});
