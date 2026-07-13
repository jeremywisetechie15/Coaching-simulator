import { describe, expect, it } from "vitest";
import { EMPTY_COACH_EDITOR_VALUES } from "@/features/coaches/domain/coach-list";
import { saveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { CONTENT_STATUS } from "@/features/content/domain";
import { createCoachInsert } from "./coach.persistence";

describe("createCoachInsert", () => {
    it("creates a draft duplicate row with its copied background", () => {
        const input = saveCoachDto.parse({
            ...EMPTY_COACH_EDITOR_VALUES,
            name: "Pierre Laurent (2)",
            systemInstructions: "Instructions",
        });

        expect(createCoachInsert(input, {
            avatarUrl: input.avatarSrc || null,
            backgroundImagePath: "coaches/coach-copy/background.webp",
            createdBy: "admin-1",
            id: "coach-copy",
            now: "2026-07-12T20:00:00.000Z",
            status: CONTENT_STATUS.draft,
        })).toMatchObject({
            background_image_path: "coaches/coach-copy/background.webp",
            created_by: "admin-1",
            id: "coach-copy",
            name: "Pierre Laurent (2)",
            status: "draft",
        });
    });
});
