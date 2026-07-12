import { describe, expect, it } from "vitest";
import { saveCoachDto } from "./save-coach.dto";

const validCoach = {
    avatarSrc: "/coaches/avatar.png",
    certifications: "ICF, DISC",
    coachingStyle: "Optimiste",
    diploma: "Master coaching professionnel",
    discProfile: "Stable",
    expertiseDomain: "Commercial",
    name: "Pierre Laurent",
    systemInstructions: "Accompagner l'apprenant avec un ton factuel.",
    voiceId: "cedar",
};

describe("saveCoachDto", () => {
    it("accepts coach profile fields from their SSOT values", () => {
        const parsed = saveCoachDto.parse(validCoach);

        expect(parsed).toMatchObject({
            backgroundImagePath: "",
            certifications: "ICF, DISC",
            coachingStyle: "Optimiste",
            diploma: "Master coaching professionnel",
            discProfile: "Stable",
            expertiseDomain: "Commercial",
        });
    });

    it("accepts an existing background path while editing", () => {
        expect(
            saveCoachDto.parse({
                ...validCoach,
                backgroundImagePath: "coaches/coach-1/background.webp",
            }).backgroundImagePath,
        ).toBe("coaches/coach-1/background.webp");
    });

    it("rejects unknown domain, coaching style and DISC profile values", () => {
        expect(() =>
            saveCoachDto.parse({
                ...validCoach,
                coachingStyle: "Sympathique",
                discProfile: "Analytique",
                expertiseDomain: "Finance",
            }),
        ).toThrow();
    });
});
