import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";
import { RoleplaySessionResultCard } from "./RoleplaySessionResultCard";

describe("RoleplaySessionResultCard", () => {
    it("shows the global score, success feedback and evaluation action", () => {
        const html = renderToStaticMarkup(
            <RoleplaySessionResultCard
                onViewEvaluation={vi.fn()}
                scorePercent={84}
                validationThreshold={80}
            />,
        );

        expect(html).toContain("Session évaluée");
        expect(html).not.toContain("Session terminée");
        expect(html).toContain("84%");
        expect(html).toContain("Voir l’évaluation");
        expect(html).not.toContain("Bravo, objectif atteint !");
        expect(html).not.toContain("<svg");
        expect(html).toContain("aspect-square");
        expect(html).toContain("backdrop-blur-2xl");
        expect(html).toContain(uiTokens.progression.level.green.fill);
    });

    it("does not render a score-dependent message", () => {
        const html = renderToStaticMarkup(
            <RoleplaySessionResultCard
                onViewEvaluation={vi.fn()}
                scorePercent={74}
                validationThreshold={80}
            />,
        );

        expect(html).toContain("74%");
        expect(html).not.toContain("Il vous manque");
        expect(html).not.toContain("objectif");
        expect(html).toContain(uiTokens.progression.level.yellow.fill);
        expect(html).not.toContain("#FFFBEB");
    });
});
