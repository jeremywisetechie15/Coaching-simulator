import { describe, expect, it } from "vitest";
import {
    ROLEPLAY_COACH_TRANSCRIPT_EVENT,
    buildRoleplayStepCoachReferenceTranscript,
    formatRoleplayCoachMessageTime,
    isRoleplayCoachTranscriptEvent,
} from "./coach-session-notes";

const validEvent = {
    coachSessionId: "c1295bce-cbe8-4b2c-965b-2ba64a865d1e",
    message: {
        content: "Travaillons votre accroche.",
        id: "88f0cc29-1805-44a2-b86f-d15be4e81975",
        role: "assistant",
        timestamp: "2026-07-12T09:10:11.000Z",
    },
    scenarioId: "f1e40c16-4946-402b-9797-750395707687",
    type: ROLEPLAY_COACH_TRANSCRIPT_EVENT,
};

describe("coach session notes domain", () => {
    it("accepts the shared iframe transcript event contract", () => {
        expect(isRoleplayCoachTranscriptEvent(validEvent)).toBe(true);
    });

    it("rejects events with an unsupported message role", () => {
        expect(isRoleplayCoachTranscriptEvent({
            ...validEvent,
            message: { ...validEvent.message, role: "system" },
        })).toBe(false);
    });

    it("formats message time using the application timezone", () => {
        expect(formatRoleplayCoachMessageTime("2026-07-12T09:10:11.000Z")).toBe("11:10:11");
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
