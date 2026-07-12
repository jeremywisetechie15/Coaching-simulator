import { describe, expect, it } from "vitest";
import { ROLEPLAY_COACH_NOTE_TYPE } from "@/features/roleplays/domain";
import {
    getRoleplayCoachNotesContextSchema,
    saveRoleplayCoachNotesSchema,
} from "./save-roleplay-coach-notes.dto";

const transcriptMessageId = "88f0cc29-1805-44a2-b86f-d15be4e81975";

function validInput() {
    return {
        coachMode: "before_training",
        methodStepId: "db19834a-0ce2-4426-9903-b96bac9618c6",
        notes: [{
            content: "Une note utile",
            createdAt: "2026-07-12T09:10:15.000Z",
            id: "cb27bd22-4207-40aa-92ba-64d01965616f",
            sourceMessageId: transcriptMessageId,
            type: ROLEPLAY_COACH_NOTE_TYPE.keyPoint,
        }],
        stepOrder: 1,
    };
}

describe("saveRoleplayCoachNotesSchema", () => {
    it("parses the step context from URL query parameters", () => {
        expect(getRoleplayCoachNotesContextSchema.parse({
            coachMode: "before_training",
            methodStepId: "db19834a-0ce2-4426-9903-b96bac9618c6",
            stepOrder: "2",
        })).toEqual({
            coachMode: "before_training",
            methodStepId: "db19834a-0ce2-4426-9903-b96bac9618c6",
            stepOrder: 2,
        });
    });

    it("accepts a collection of notes linked to a roleplay step", () => {
        expect(saveRoleplayCoachNotesSchema.parse(validInput())).toEqual(validInput());
    });

    it("keeps notes imported from an earlier transcript", () => {
        const input = validInput();
        input.notes[0].sourceMessageId = "cd57a293-94cf-49ef-a6b0-f15892c25ba3";

        expect(saveRoleplayCoachNotesSchema.safeParse(input).success).toBe(true);
    });

    it("rejects unsupported note types", () => {
        const input = validInput();
        input.notes[0].type = "warning" as never;

        expect(saveRoleplayCoachNotesSchema.safeParse(input).success).toBe(false);
    });
});
