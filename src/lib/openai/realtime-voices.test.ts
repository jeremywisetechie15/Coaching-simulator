import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    DEFAULT_COACH_VOICE_ID,
    getOpenAIRealtimeVoice,
    OPENAI_REALTIME_VOICES,
    resolveOpenAIRealtimeVoiceId,
} from "./realtime-voices";

describe("OPENAI_REALTIME_VOICES", () => {
    it("matches the built-in voices supported by the OpenAI Realtime API", () => {
        expect(OPENAI_REALTIME_VOICES.map((voice) => voice.id)).toEqual([
            "alloy",
            "ash",
            "ballad",
            "coral",
            "echo",
            "sage",
            "shimmer",
            "verse",
            "marin",
            "cedar",
        ]);
    });

    it("centralizes a unique local preview for every supported voice", () => {
        const previewPaths = OPENAI_REALTIME_VOICES.map((voice) => voice.previewSrc);
        const previewDirectory = path.join(process.cwd(), "public", "audio", "openai-voices");

        expect(new Set(previewPaths).size).toBe(OPENAI_REALTIME_VOICES.length);

        for (const previewPath of previewPaths) {
            const publicPath = path.join(
                process.cwd(),
                "public",
                previewPath.replace(/^\//, ""),
            );

            expect(existsSync(publicPath), `${previewPath} doit exister dans public`).toBe(true);
            expect(statSync(publicPath).size, `${previewPath} ne doit pas être vide`).toBeGreaterThan(44);
        }

        const audioFileNames = readdirSync(previewDirectory)
            .filter((fileName) => fileName.endsWith(".wav"))
            .sort();

        expect(audioFileNames).toEqual(
            previewPaths.map((previewPath) => path.basename(previewPath)).sort(),
        );
    });

    it("returns the display name and preview from the same registry entry", () => {
        expect(getOpenAIRealtimeVoice("shimmer")).toMatchObject({
            name: "Shimmer",
            previewSrc: "/audio/openai-voices/openai_voice_Shimmer.wav",
        });
    });

    it("uses the correct canonical fallback for personas and coaches", () => {
        expect(resolveOpenAIRealtimeVoiceId(null)).toBe("alloy");
        expect(resolveOpenAIRealtimeVoiceId("unsupported", DEFAULT_COACH_VOICE_ID)).toBe("cedar");
        expect(resolveOpenAIRealtimeVoiceId("marin", DEFAULT_COACH_VOICE_ID)).toBe("marin");
    });
});
