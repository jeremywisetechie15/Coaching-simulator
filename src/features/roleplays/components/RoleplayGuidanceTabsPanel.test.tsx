import { renderToStaticMarkup } from "react-dom/server";
import { CheckCircle2, Sparkles } from "lucide-react";
import { describe, expect, it } from "vitest";
import { RoleplayGuidanceTabsPanel } from "./RoleplayGuidanceTabsPanel";

describe("RoleplayGuidanceTabsPanel", () => {
    it("renders every tab and the initial tab content as a bullet list", () => {
        const html = renderToStaticMarkup(
            <RoleplayGuidanceTabsPanel
                ariaLabel="Conseils du coach"
                initialTab="strengths"
                tabs={[
                    {
                        icon: CheckCircle2,
                        items: ["Accroche claire", "Reformulation précise"],
                        key: "strengths",
                        label: "Points forts",
                        tone: "green",
                    },
                    {
                        icon: Sparkles,
                        items: ["Préparer une question ouverte"],
                        key: "progress",
                        label: "Plan de progrès",
                        tone: "indigo",
                    },
                ]}
            />,
        );

        expect(html).toContain('role="tablist"');
        expect(html).toContain('aria-label="Conseils du coach"');
        expect(html).toContain('aria-selected="true"');
        expect(html).toContain("Points forts");
        expect(html).toContain("Plan de progrès");
        expect(html).toContain("Accroche claire");
        expect(html).toContain("Reformulation précise");
        expect(html).not.toContain("Préparer une question ouverte");
    });
});
