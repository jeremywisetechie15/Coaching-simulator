import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

describe("SegmentedControl", () => {
    it("exposes the selected exclusive option", () => {
        const html = renderToStaticMarkup(
            <SegmentedControl
                ariaLabel="Source de l'avatar"
                onChange={() => undefined}
                options={[
                    { label: "Importer", value: "upload" },
                    { label: "URL", value: "url" },
                ]}
                value="upload"
            />,
        );

        expect(html).toContain('aria-label="Source de l&#x27;avatar"');
        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain("Importer");
    });
});
