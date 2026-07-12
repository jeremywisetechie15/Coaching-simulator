import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VoiceDescriptor, VoiceRecommendationBadge } from "./VoiceDescriptor";

describe("VoiceDescriptor", () => {
    it("shows only the shared recommendation badge for a recommended voice", () => {
        const html = renderToStaticMarkup(<VoiceRecommendationBadge voiceId="cedar" />);

        expect(html).toContain("Recommandée");
        expect(html).not.toContain("OpenAI");
        expect(html).not.toContain("Qualité recommandée");
    });

    it("shows the characteristic for another voice", () => {
        const html = renderToStaticMarkup(
            <VoiceDescriptor characteristic="Douce et calme" />,
        );

        expect(html).toContain("Douce et calme");
        expect(html).not.toContain("Recommandée");
    });
});
