import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";
import { AnimatedEntityHeader } from "./AnimatedEntityHeader";

describe("AnimatedEntityHeader", () => {
    it("renders the semantic title, actions, and reusable roleplay tone", () => {
        const html = renderToStaticMarkup(
            <AnimatedEntityHeader
                actions={<button type="button">Créer</button>}
                title="Bibliothèque de Roleplays"
                tone="roleplay"
            />,
        );

        expect(html).toContain("<header");
        expect(html).toContain("<h1");
        expect(html).toContain("Bibliothèque de Roleplays");
        expect(html).toContain("<button");
        expect(html).toContain("--entity-header-gradient-from");
        expect(html).toContain(uiTokens.entityHeader.title);
    });

    it("keeps both animated waves decorative", () => {
        const html = renderToStaticMarkup(
            <AnimatedEntityHeader title="Bibliothèque" tone="roleplay" />,
        );

        expect(html.match(/viewBox="0 0 2400 120"/g)).toHaveLength(2);
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('focusable="false"');
    });

    it("exposes the quiz palette through the same reusable component", () => {
        const html = renderToStaticMarkup(
            <AnimatedEntityHeader title="Quiz" tone="quiz" />,
        );

        expect(html).toContain("--entity-header-gradient-from:#0F766E");
        expect(html).toContain("--entity-header-gradient-middle:#0891B2");
        expect(html).toContain("--entity-header-gradient-to:#22C55E");
    });

    it.each([
        ["coach", "#BE123C", "#E11D48", "#FB7185"],
        ["method", "#6D28D9", "#9333EA", "#DB2777"],
        ["persona", "#7C3AED", "#C026D3", "#6366F1"],
        ["scorecard", "#B45309", "#EA580C", "#F59E0B"],
        ["skill", "#1D4ED8", "#2563EB", "#06B6D4"],
    ] as const)(
        "keeps the %s palette in the shared design-token contract",
        (tone, from, middle, to) => {
            const html = renderToStaticMarkup(
                <AnimatedEntityHeader title={tone} tone={tone} />,
            );

            expect(html).toContain(`--entity-header-gradient-from:${from}`);
            expect(html).toContain(`--entity-header-gradient-middle:${middle}`);
            expect(html).toContain(`--entity-header-gradient-to:${to}`);
        },
    );
});
