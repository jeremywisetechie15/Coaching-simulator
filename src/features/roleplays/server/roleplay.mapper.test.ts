import { afterEach, describe, expect, it, vi } from "vitest";
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
