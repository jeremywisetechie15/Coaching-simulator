import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    getOpenAIRealtimeVoice,
    OPENAI_REALTIME_VOICES,
} from "./realtime-voices";

describe("OPENAI_REALTIME_VOICES", () => {
    it("centralizes a unique local preview for every supported voice", () => {
        const previewPaths = OPENAI_REALTIME_VOICES.map((voice) => voice.previewSrc);

        expect(new Set(previewPaths).size).toBe(OPENAI_REALTIME_VOICES.length);

        for (const previewPath of previewPaths) {
            const publicPath = path.join(
                process.cwd(),
                "public",
                previewPath.replace(/^\//, ""),
            );

            expect(existsSync(publicPath), `${previewPath} doit exister dans public`).toBe(true);
        }
    });

    it("returns the display name and preview from the same registry entry", () => {
        expect(getOpenAIRealtimeVoice("shimmer")).toMatchObject({
            name: "Shimmer",
            previewSrc: "/audio/openai-voices/openai_voice_Shimmer.wav",
        });
    });
});
