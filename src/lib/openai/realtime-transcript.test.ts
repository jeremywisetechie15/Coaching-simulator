import { describe, expect, it } from "vitest";
import { extractRealtimeAssistantTranscript } from "./realtime-transcript";

describe("extractRealtimeAssistantTranscript", () => {
    it("reads direct transcript events", () => {
        expect(
            extractRealtimeAssistantTranscript({
                transcript: "Bonjour, je vous écoute.",
                type: "response.output_audio.done",
            }),
        ).toBe("Bonjour, je vous écoute.");
    });

    it("reads assistant audio transcripts from response.done", () => {
        expect(
            extractRealtimeAssistantTranscript({
                response: {
                    output: [
                        {
                            content: [
                                {
                                    transcript: "Je ne suis pas disponible maintenant.",
                                    type: "audio",
                                },
                            ],
                            role: "assistant",
                            type: "message",
                        },
                    ],
                },
                type: "response.done",
            }),
        ).toBe("Je ne suis pas disponible maintenant.");
    });

    it("ignores user output content", () => {
        expect(
            extractRealtimeAssistantTranscript({
                response: {
                    output: [
                        {
                            content: [{ text: "Message utilisateur" }],
                            role: "user",
                        },
                    ],
                },
            }),
        ).toBeNull();
    });
});
