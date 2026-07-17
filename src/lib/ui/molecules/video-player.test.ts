import { describe, expect, it } from "vitest";
import { resolveVideoPlayerSource } from "./video-player";

describe("resolveVideoPlayerSource", () => {
    it("converts YouTube watch URLs to privacy-enhanced embeds", () => {
        expect(resolveVideoPlayerSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
            kind: "youtube",
            url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        });
    });

    it("converts short YouTube URLs to privacy-enhanced embeds", () => {
        expect(resolveVideoPlayerSource("https://youtu.be/dQw4w9WgXcQ?t=12")).toEqual({
            kind: "youtube",
            url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        });
    });

    it("converts Vimeo URLs to player embeds", () => {
        expect(resolveVideoPlayerSource("https://vimeo.com/123456789")).toEqual({
            kind: "vimeo",
            url: "https://player.vimeo.com/video/123456789",
        });
    });

    it("keeps authenticated application routes as direct sources", () => {
        const url = "/api/methods/method-1/resources/resource-1";
        expect(resolveVideoPlayerSource(url)).toEqual({ kind: "direct", url });
    });

    it("keeps remote video files as direct sources", () => {
        const url = "https://cdn.example.com/training/video.mp4";
        expect(resolveVideoPlayerSource(url)).toEqual({ kind: "direct", url });
    });
});
