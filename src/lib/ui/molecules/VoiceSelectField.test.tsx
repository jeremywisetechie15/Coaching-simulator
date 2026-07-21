import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VoiceSelectField } from "./VoiceSelectField";

describe("VoiceSelectField", () => {
    it("renders voice names without descriptions and exposes the selected preview action", () => {
        const html = renderToStaticMarkup(
            <VoiceSelectField
                id="voice"
                value="shimmer"
                onChange={() => undefined}
            />,
        );

        expect(html).toContain(">Shimmer</option>");
        expect(html).not.toContain("Vive et enjouée");
        expect(html).toContain("Écouter");
        expect(html).toContain("voix Shimmer");
    });
});
