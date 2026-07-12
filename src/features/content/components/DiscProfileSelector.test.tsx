import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DISC_PROFILE } from "@/features/content/domain";
import { DiscProfileSelector } from "./DiscProfileSelector";

describe("DiscProfileSelector", () => {
    it("uses the canonical selected color for each profile", () => {
        const html = renderToStaticMarkup(
            <DiscProfileSelector
                value={DISC_PROFILE.influential}
                onChange={() => undefined}
                options={[
                    {
                        description: "Direct",
                        label: DISC_PROFILE.dominant,
                        value: DISC_PROFILE.dominant,
                    },
                    {
                        description: "Sociable",
                        label: DISC_PROFILE.influential,
                        value: DISC_PROFILE.influential,
                    },
                ]}
            />,
        );

        expect(html).toContain('role="group"');
        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain("border-[#EAB308]");
        expect(html).not.toContain("border-[#16A34A]");
    });
});
