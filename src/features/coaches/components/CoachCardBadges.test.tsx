import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import { CoachCardBadges } from "./CoachCardBadges";

const coach: CoachListItem = {
    avatarSrc: null,
    backgroundImagePath: null,
    certifications: "ICF",
    coachingStyle: "Optimiste",
    createdAt: "",
    diploma: "Master coaching",
    discProfile: "Stable",
    expertiseDomain: "Management",
    id: "coach-1",
    name: "Pierre Laurent",
    status: "published",
    voiceCharacteristic: null,
    voiceId: "cedar",
    voiceName: "Cedar",
};

describe("CoachCardBadges", () => {
    it("renders only profile data persisted for the coach", () => {
        const html = renderToStaticMarkup(<CoachCardBadges coach={coach} />);

        expect(html).toContain("Optimiste");
        expect(html).toContain("Stable");
        expect(html).toContain("Management");
        expect(html).toContain("Master coaching");
        expect(html).toContain("ICF");
        expect(html).not.toContain("Banque");
        expect(html).not.toContain("Retail");
    });

    it("omits empty optional badges", () => {
        const html = renderToStaticMarkup(
            <CoachCardBadges coach={{ ...coach, certifications: "", diploma: "", expertiseDomain: "" }} />,
        );

        expect(html).not.toContain("Master coaching");
        expect(html).not.toContain("ICF");
    });
});
