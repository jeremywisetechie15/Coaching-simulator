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
                session_id: null,
                step_order: 1,
            }],
            new Map([["db19834a-0ce2-4426-9903-b96bac9618c6", "Démarrer l'appel"]]),
        );

        expect(groups).toEqual([{
            coachMode: ROLEPLAY_COACH_MODE.beforeTraining,
            methodStepId: "db19834a-0ce2-4426-9903-b96bac9618c6",
            notes: [note],
            savedAt: "2026-07-29T14:09:00.000Z",
            sessionId: null,
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
                session_id: null,
                step_order: 1,
            }],
            new Map(),
        )).toEqual([]);
    });

    it("maps evaluation notes to their session instead of a method step", () => {
        const sessionId = "ed3ee630-f8f8-4ae4-8787-3a65a4a1ed44";
        const groups = mapRoleplayCoachNoteGroups(
            [{
                coach_mode: ROLEPLAY_COACH_MODE.personaFeedback,
                id: "saved-context-2",
                method_step_id: null,
                notes: [note],
                saved_at: "2026-07-29T14:09:00.000Z",
                session_id: sessionId,
                step_order: 1,
            }],
            new Map(),
        );

        expect(groups[0]).toMatchObject({
            coachMode: ROLEPLAY_COACH_MODE.personaFeedback,
            methodStepId: null,
            sessionId,
            stepTitle: "Évaluation de la session",
        });
    });

    it("rejects invalid persisted note payloads", () => {
        expect(() => mapRoleplayCoachNoteGroups(
            [{
                coach_mode: ROLEPLAY_COACH_MODE.beforeTraining,
                id: "saved-context-1",
                method_step_id: null,
                notes: [{ content: "" }],
                saved_at: "2026-07-29T14:09:00.000Z",
                session_id: null,
                step_order: 1,
            }],
            new Map(),
        )).toThrow("Les notes de préparation enregistrées sont invalides.");
    });
});
