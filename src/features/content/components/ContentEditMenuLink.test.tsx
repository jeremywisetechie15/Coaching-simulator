import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { ContentEditMenuLink } from "./ContentEditMenuLink";

describe("ContentEditMenuLink", () => {
    it.each([CONTENT_STATUS.draft, CONTENT_STATUS.published])(
        "offers the edit action for %s content",
        (status) => {
            const html = renderToStaticMarkup(
                <ContentEditMenuLink href="/content/edit" status={status} />,
            );

            expect(html).toContain('href="/content/edit"');
            expect(html).toContain("Modifier");
        },
    );

    it("hides the edit action for terminal archived content", () => {
        const html = renderToStaticMarkup(
            <ContentEditMenuLink href="/content/edit" status={CONTENT_STATUS.archived} />,
        );

        expect(html).toBe("");
    });
});
