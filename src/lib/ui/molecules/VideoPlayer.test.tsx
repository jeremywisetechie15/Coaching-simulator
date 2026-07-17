import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VideoPlayer } from "./VideoPlayer";

describe("VideoPlayer", () => {
    it("renders uploaded resources with the native video player", () => {
        const html = renderToStaticMarkup(
            <VideoPlayer src="/api/methods/method-1/resources/resource-1" title="Capsule" />,
        );

        expect(html).toContain("<video");
        expect(html).toContain('/api/methods/method-1/resources/resource-1');
        expect(html).not.toContain("<iframe");
    });

    it("renders YouTube URLs in an embedded player", () => {
        const html = renderToStaticMarkup(
            <VideoPlayer src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Capsule" />,
        );

        expect(html).toContain("<iframe");
        expect(html).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
        expect(html).toContain('title="Capsule"');
    });
});
