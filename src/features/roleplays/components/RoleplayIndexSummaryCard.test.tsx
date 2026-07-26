import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoleplayIndexSummaryCard } from "./RoleplayIndexSummaryCard";

function renderCard({
    score,
    sessionCount,
}: {
    score: number | null;
    sessionCount: number;
}) {
    return renderToStaticMarkup(
        <RoleplayIndexSummaryCard
            delta={null}
            score={score}
            sessionCount={sessionCount}
            sessions={[]}
            trend="unavailable"
        />,
    );
}

describe("RoleplayIndexSummaryCard", () => {
    it("shows no measurement before the first simulation", () => {
        const html = renderCard({ score: null, sessionCount: 0 });

        expect(html).toContain(">-</p>");
        expect(html).toContain("Aucune mesure");
        expect(html).not.toContain("En cours de calcul");
    });

    it("hides the score while fewer than three simulations are available", () => {
        const html = renderCard({ score: 65, sessionCount: 2 });

        expect(html).toContain(">-</p>");
        expect(html).toContain("En cours de calcul");
        expect(html).not.toContain("65%");
    });

    it("shows the score from the third simulation", () => {
        const html = renderCard({ score: 70, sessionCount: 3 });

        expect(html).toContain("70%");
        expect(html).not.toContain("En cours de calcul");
    });
});
