import { afterEach, describe, expect, it, vi } from "vitest";
import { LEARNER_CONTENT_STATUS } from "@/features/content/domain";
import { personaAvatarOptions } from "@/features/personas/data/persona-creation";
import { mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import {
    formatRoleplayDate,
    formatRoleplayTime,
    mapRoleplayRowToListItem,
    type RoleplayRow,
} from "./roleplay.mapper";

afterEach(() => {
    vi.unstubAllEnvs();
});

function mapAvatarToRoleplayCard(avatarUrl: string) {
    const row: RoleplayRow = {
        id: "roleplay-1",
        persona_avatar_url: avatarUrl,
        persona_id: "persona-1",
        title: "Prospection commerciale",
    };

    return mapDbRoleplayToUi(mapRoleplayRowToListItem(row), null).avatarSrc;
}

function mapCoachToRoleplay(avatarUrl: string) {
    const row: RoleplayRow = {
        coach_avatar_url: avatarUrl,
        coach_id: "coach-1",
        coach_name: "Jannik BOA",
        id: "roleplay-1",
        persona_id: "persona-1",
        title: "Prospection commerciale",
    };

    return mapDbRoleplayToUi(mapRoleplayRowToListItem(row), null);
}

describe("roleplay session date formatting", () => {
    it("formats the date and time in the application timezone", () => {
        const timestamp = "2026-07-12T22:30:00.000Z";

        expect(formatRoleplayDate(timestamp)).toBe("13/07/2026");
        expect(formatRoleplayTime(timestamp)).toBe("00:30");
    });

    it("returns explicit fallbacks when the timestamp is missing", () => {
        expect(formatRoleplayDate(null)).toBe("Aucune session");
        expect(formatRoleplayTime(null)).toBe("Heure inconnue");
    });
});

describe("roleplay card persona avatar", () => {
    it("resolves an uploaded Storage avatar to its public URL", () => {
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");

        expect(mapAvatarToRoleplayCard("persona-1/avatar profile.webp")).toBe(
            "https://project.supabase.co/storage/v1/object/public/personas-avatars/persona-1/avatar%20profile.webp",
        );
    });

    it("keeps an external avatar URL unchanged", () => {
        expect(mapAvatarToRoleplayCard("https://cdn.example.com/persona.webp")).toBe(
            "https://cdn.example.com/persona.webp",
        );
    });

    it("keeps a proposed library avatar URL unchanged", () => {
        const proposedAvatarUrl = personaAvatarOptions[0]?.src;

        expect(proposedAvatarUrl).toBeDefined();
        expect(mapAvatarToRoleplayCard(proposedAvatarUrl ?? "")).toBe(proposedAvatarUrl);
    });
});

describe("roleplay card learner statistics", () => {
    it("maps the eligible attempt count and best score to the card model", () => {
        const row: RoleplayRow = {
            id: "roleplay-1",
            title: "Prospection commerciale",
        };
        const roleplay = mapDbRoleplayToUi(
            mapRoleplayRowToListItem(
                row,
                0,
                2,
                LEARNER_CONTENT_STATUS.validated,
                84,
            ),
            null,
        );

        expect(roleplay.detail.simulations).toBe(2);
        expect(roleplay.detail.meilleurScore).toBe(84);
    });
});

describe("roleplay persona facts", () => {
    it("maps the persona business fields used by roleplay badges", () => {
        const roleplay = mapRoleplayRowToListItem({
            id: "roleplay-1",
            persona_age: 32,
            persona_annual_revenue: "40 M€",
            persona_employee_count: 1800,
            persona_industry: "Immobilier",
            title: "Prospection immobilière",
        });

        expect(roleplay.personaFacts).toEqual({
            age: 32,
            annualRevenue: "40 M€",
            employeeCount: 1800,
            industry: "Immobilier",
        });
    });
});

describe("roleplay coach presentation", () => {
    it("keeps the associated coach identity and external avatar", () => {
        const roleplay = mapCoachToRoleplay("https://cdn.example.com/coach.webp");

        expect(roleplay.coachId).toBe("coach-1");
        expect(roleplay.coachName).toBe("Jannik BOA");
        expect(roleplay.coachAvatarSrc).toBe("https://cdn.example.com/coach.webp");
    });
});
