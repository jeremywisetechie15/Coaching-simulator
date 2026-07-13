import { describe, expect, it } from "vitest";
import {
    buildRoleplayNotationTranscript,
    buildRoleplayNotationTranscriptText,
} from "./roleplay-notation-transcript";

describe("roleplay notation transcript", () => {
    it("builds the legacy-compatible transcription payload without an AI call", () => {
        const transcript = buildRoleplayNotationTranscript([
            {
                content: " Bonjour, je vous appelle pour votre projet. ",
                role: "user",
                timestamp: "2026-07-13T10:00:00.000Z",
            },
            {
                content: "Quel projet exactement ?",
                role: "assistant",
                timestamp: "2026-07-13T10:00:05.400Z",
            },
            { content: "   ", role: "user", timestamp: "2026-07-13T10:00:06.000Z" },
        ]);

        expect(transcript).toMatchObject({
            exclude_from_global_score: true,
            messages_apprenant: 1,
            messages_persona: 1,
            onglet: "Transcription",
            total_messages: 2,
        });
        expect(transcript.conversation).toEqual([
            expect.objectContaining({
                etape_methodo: null,
                id: 1,
                is_ai_response: false,
                speaker: "Apprenant",
                timecode_relative: "00:00:00",
                verbatim: "Bonjour, je vous appelle pour votre projet.",
            }),
            expect.objectContaining({
                id: 2,
                is_ai_response: true,
                speaker: "Persona",
                timecode_relative: "00:00:05",
                verbatim: "Quel projet exactement ?",
            }),
        ]);
        expect(buildRoleplayNotationTranscriptText(transcript)).toContain(
            "[M1] [12:00:00] Utilisateur: Bonjour, je vous appelle pour votre projet.",
        );
    });
});
