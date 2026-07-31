import { describe, expect, it } from "vitest";
import {
    buildRoleplayStepCoachReferenceTranscript,
    formatRoleplayCoachMessageTime,
    formatRoleplayCoachNotesSavedAt,
    groupRoleplayCoachNotesByStep,
    replaceRoleplayCoachNoteGroup,
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_NOTE_TYPE,
    type RoleplayCoachNoteGroup,
    updateRoleplayCoachNote,
} from "./coach-session-notes";

const noteGroup: RoleplayCoachNoteGroup = {
    coachMode: ROLEPLAY_COACH_MODE.beforeTraining,
    methodStepId: "db19834a-0ce2-4426-9903-b96bac9618c6",
    notes: [{
        content: "Conserver une accroche courte.",
        createdAt: "2026-07-29T14:09:00.000Z",
        id: "cb27bd22-4207-40aa-92ba-64d01965616f",
        sourceMessageId: null,
        type: ROLEPLAY_COACH_NOTE_TYPE.keyPoint,
    }],
    savedAt: "2026-07-29T14:09:00.000Z",
    stepOrder: 1,
    stepTitle: "Démarrer l'appel",
};

describe("coach session notes domain", () => {
    it("formats message time using the application timezone", () => {
        expect(formatRoleplayCoachMessageTime("2026-07-12T09:10:11.000Z")).toBe("11:10:11");
    });

    it("formats the persisted note date using the application timezone", () => {
        expect(formatRoleplayCoachNotesSavedAt("2026-07-29T14:09:00.000Z")).toBe(
            "29 juillet 2026 à 16:09",
        );
    });

    it("updates a persisted note without changing its identity or source metadata", () => {
        const updatedGroup = updateRoleplayCoachNote(
            noteGroup,
            noteGroup.notes[0].id,
            {
                content: "Poser une question ouverte dès l'accroche.",
                type: ROLEPLAY_COACH_NOTE_TYPE.suggestion,
            },
        );

        expect(updatedGroup.notes[0]).toEqual({
            ...noteGroup.notes[0],
            content: "Poser une question ouverte dès l'accroche.",
            type: ROLEPLAY_COACH_NOTE_TYPE.suggestion,
        });
    });

    it("replaces only the matching step and coach mode after saving", () => {
        const afterTrainingGroup: RoleplayCoachNoteGroup = {
            ...noteGroup,
            coachMode: ROLEPLAY_COACH_MODE.afterTraining,
        };
        const updatedPreparationGroup = {
            ...noteGroup,
            savedAt: "2026-07-30T14:09:00.000Z",
        };

        expect(replaceRoleplayCoachNoteGroup(
            [noteGroup, afterTrainingGroup],
            updatedPreparationGroup,
        )).toEqual([updatedPreparationGroup, afterTrainingGroup]);
    });

    it("groups notes from before and after training into one roleplay step", () => {
        const afterTrainingGroup: RoleplayCoachNoteGroup = {
            ...noteGroup,
            coachMode: ROLEPLAY_COACH_MODE.afterTraining,
            notes: [{
                ...noteGroup.notes[0],
                content: "Reformuler plus directement.",
                id: "72080226-21a1-4d1d-9077-588bc1210b34",
            }],
            savedAt: "2026-07-30T14:09:00.000Z",
        };

        const [stepGroup] = groupRoleplayCoachNotesByStep([noteGroup, afterTrainingGroup]);

        expect(stepGroup.stepOrder).toBe(1);
        expect(stepGroup.entries.map(({ note }) => note.content)).toEqual([
            "Conserver une accroche courte.",
            "Reformuler plus directement.",
        ]);
        expect(stepGroup.savedAt).toBe(afterTrainingGroup.savedAt);
    });

    it("uses the selected step transcript when notation segmented the session", () => {
        const transcript = buildRoleplayStepCoachReferenceTranscript({
            axesAmelioration: [],
            coachAppreciation: "",
            discourse: [],
            momentsCles: [],
            personaAvis: "",
            planEtape: { number: 1, text: "", title: "" },
            pointsPositifs: [],
            prioriteStrategique: "",
            steps: [{
                criteria: [],
                icon: "phone",
                number: 2,
                score: 60,
                status: "À consolider",
                stepTranscript: {
                    end: "01:48",
                    lines: [
                        { speaker: "you", text: "Si je reformule..." },
                        { speaker: "persona", text: "C'est bien cela." },
                    ],
                    start: "01:42",
                },
                title: "Découvrir",
                total: "60/100",
            }],
            transcript: [{ speaker: "you", text: "Transcript complet", time: "00:01" }],
        }, 2);

        expect(transcript).toEqual([
            {
                id: "evaluated-step-2-message-1",
                speaker: "you",
                text: "Si je reformule...",
                time: "01:42",
            },
            {
                id: "evaluated-step-2-message-2",
                speaker: "persona",
                text: "C'est bien cela.",
                time: "01:48",
            },
        ]);
    });

    it("falls back to the complete evaluated session transcript", () => {
        const transcript = buildRoleplayStepCoachReferenceTranscript({
            axesAmelioration: [],
            coachAppreciation: "",
            discourse: [],
            momentsCles: [],
            personaAvis: "",
            planEtape: { number: 1, text: "", title: "" },
            pointsPositifs: [],
            prioriteStrategique: "",
            steps: [],
            transcript: [{ speaker: "you", text: "Transcript complet", time: "00:01" }],
        }, 2);

        expect(transcript).toEqual([
            {
                id: "evaluated-session-message-1",
                speaker: "you",
                text: "Transcript complet",
                time: "00:01",
            },
        ]);
    });
});
