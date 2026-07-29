import { describe, expect, it } from "vitest";
import {
    buildRoleplayStepCoachReferenceTranscript,
    formatRoleplayCoachMessageTime,
    formatRoleplayCoachNotesSavedAt,
} from "./coach-session-notes";

describe("coach session notes domain", () => {
    it("formats message time using the application timezone", () => {
        expect(formatRoleplayCoachMessageTime("2026-07-12T09:10:11.000Z")).toBe("11:10:11");
    });

    it("formats the persisted note date using the application timezone", () => {
        expect(formatRoleplayCoachNotesSavedAt("2026-07-29T14:09:00.000Z")).toBe(
            "29 juillet 2026 à 16:09",
        );
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
