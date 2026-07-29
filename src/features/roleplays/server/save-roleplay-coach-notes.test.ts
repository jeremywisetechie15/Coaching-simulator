import { describe, expect, it } from "vitest";
import { ROLEPLAY_COACH_MODE, ROLEPLAY_COACH_NOTE_TYPE } from "@/features/roleplays/domain";
import { mapRoleplayCoachNoteGroups } from "./save-roleplay-coach-notes";

const note = {
    content: "Conserver une accroche courte.",
    createdAt: "2026-07-29T14:09:00.000Z",
    id: "cb27bd22-4207-40aa-92ba-64d01965616f",
    sourceMessageId: null,
    type: ROLEPLAY_COACH_NOTE_TYPE.keyPoint,
};

describe("mapRoleplayCoachNoteGroups", () => {
    it("maps persisted notes with their real method-step title", () => {
        const groups = mapRoleplayCoachNoteGroups(
            [{
                coach_mode: ROLEPLAY_COACH_MODE.beforeTraining,
                id: "saved-context-1",
                method_step_id: "db19834a-0ce2-4426-9903-b96bac9618c6",
                notes: [note],
                saved_at: "2026-07-29T14:09:00.000Z",
                step_order: 1,
            }],
            new Map([["db19834a-0ce2-4426-9903-b96bac9618c6", "Démarrer l'appel"]]),
        );

        expect(groups).toEqual([{
            coachMode: ROLEPLAY_COACH_MODE.beforeTraining,
            methodStepId: "db19834a-0ce2-4426-9903-b96bac9618c6",
            notes: [note],
            savedAt: "2026-07-29T14:09:00.000Z",
            stepOrder: 1,
            stepTitle: "Démarrer l'appel",
        }]);
    });

    it("omits saved contexts without notes", () => {
        expect(mapRoleplayCoachNoteGroups(
            [{
                coach_mode: ROLEPLAY_COACH_MODE.beforeTraining,
                id: "saved-context-1",
                method_step_id: null,
                notes: [],
                saved_at: "2026-07-29T14:09:00.000Z",
                step_order: 1,
            }],
            new Map(),
        )).toEqual([]);
    });

    it("rejects invalid persisted note payloads", () => {
        expect(() => mapRoleplayCoachNoteGroups(
            [{
                coach_mode: ROLEPLAY_COACH_MODE.beforeTraining,
                id: "saved-context-1",
                method_step_id: null,
                notes: [{ content: "" }],
                saved_at: "2026-07-29T14:09:00.000Z",
                step_order: 1,
            }],
            new Map(),
        )).toThrow("Les notes de préparation enregistrées sont invalides.");
    });
});
