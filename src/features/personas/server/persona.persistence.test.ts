import { describe, expect, it } from "vitest";
import { EMPTY_PERSONA_EDITOR_VALUES } from "@/features/personas/domain/persona-list";
import { CONTENT_STATUS } from "@/features/content/domain";
import { savePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { createPersonaInsert } from "./persona.persistence";

describe("createPersonaInsert", () => {
    it("creates a draft duplicate row with normalized nullable fields", () => {
        const input = savePersonaDto.parse({
            ...EMPTY_PERSONA_EDITOR_VALUES,
            activitySectorCode: "TIC",
            age: "42",
            name: "Sophie Martin (2)",
            pcsGroupCode: "3",
            sexCode: "female",
            systemInstructions: "Instructions",
        });

        expect(createPersonaInsert(input, {
            avatarUrl: "persona-copy/avatar.webp",
            createdBy: "admin-1",
            id: "persona-copy",
            now: "2026-07-12T20:00:00.000Z",
            status: CONTENT_STATUS.draft,
        })).toMatchObject({
            activity_sector_code: "TIC",
            age: 42,
            avatar_url: "persona-copy/avatar.webp",
            created_by: "admin-1",
            id: "persona-copy",
            name: "Sophie Martin (2)",
            pcs_group_code: "3",
            sex_code: "female",
            status: "draft",
        });
    });
});
