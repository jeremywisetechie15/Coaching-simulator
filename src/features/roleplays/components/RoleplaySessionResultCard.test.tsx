import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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

        expect(html).toContain("84%");
        expect(html).toContain("Bravo, objectif atteint !");
        expect(html).toContain("Voir l’évaluation");
    });

    it("adapts the message when the validation threshold is not reached", () => {
        const html = renderToStaticMarkup(
            <RoleplaySessionResultCard
                onViewEvaluation={vi.fn()}
                scorePercent={74}
                validationThreshold={80}
            />,
        );

        expect(html).toContain("74%");
        expect(html).toContain("Il vous manque 6 points");
        expect(html).not.toContain("Bravo");
    });
});
