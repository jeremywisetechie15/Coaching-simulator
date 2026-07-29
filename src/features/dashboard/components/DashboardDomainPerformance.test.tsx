import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardDomainPerformance } from "./DashboardDomainPerformance";

describe("DashboardDomainPerformance", () => {
    it("renders real domain data with expandable details collapsed initially", () => {
        const html = renderToStaticMarkup(
            <DashboardDomainPerformance
                groups={[
                    {
                        id: "sales",
                        items: [{ label: "Prise de rendez-vous", score: 76 }],
                        label: "Commercial",
                        score: 81,
                    },
                ]}
                scoreLabel="Score moyen roleplay"
            />,
        );

        expect(html).toContain("Commercial");
        expect(html).toContain("81%");
        expect(html).toContain('aria-expanded="false"');
        expect(html).not.toContain("Prise de rendez-vous");
    });
});
