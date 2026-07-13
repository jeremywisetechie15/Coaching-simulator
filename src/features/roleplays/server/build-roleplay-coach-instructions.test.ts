import { describe, expect, it } from "vitest";
import type { CoachRow } from "@/features/coaches/server/coach.mapper";
import {
    buildRoleplayCoachInstructions,
    serializeRoleplayCoachProfile,
} from "./build-roleplay-coach-instructions";

const coach: CoachRow = {
    avatar_url: "https://example.com/coach.webp",
    background_image_path: "coaches/coach-1/background.webp",
    certifications: "ICF",
    coaching_style: "Exigeant",
    created_at: "2026-07-13T08:00:00.000Z",
    diploma: "Master coaching",
    disc_profile: "Consciencieux",
    expertise_domain: "Commercial",
    id: "coach-1",
    name: "Coach test",
    system_instructions: "Pose des questions courtes et factuelles.",
    updated_at: "2026-07-13T08:00:00.000Z",
    voice_id: "alloy",
};

describe("roleplay coach instructions", () => {
    it("serializes every configured business field without technical media fields", () => {
        const result = JSON.parse(serializeRoleplayCoachProfile(coach));

        expect(result).toEqual({
            certifications: "ICF",
            coachingStyle: "Exigeant",
            diploma: "Master coaching",
            discProfile: "Consciencieux",
            expertiseDomain: "Commercial",
            name: "Coach test",
        });
        expect(result.avatar_url).toBeUndefined();
        expect(result.background_image_path).toBeUndefined();
        expect(result.system_instructions).toBeUndefined();
    });

    it("adds the configured profile and personalized instructions exactly once", () => {
        const result = buildRoleplayCoachInstructions("Prépare l'apprenant.", coach);

        expect(result).toContain("Prépare l'apprenant.");
        expect(result).toContain('"coachingStyle": "Exigeant"');
        expect(result).toContain('"expertiseDomain": "Commercial"');
        expect(result.match(/Pose des questions courtes et factuelles\./g)).toHaveLength(1);
        expect(result).toContain("Le contexte dynamique du roleplay");
    });
});
