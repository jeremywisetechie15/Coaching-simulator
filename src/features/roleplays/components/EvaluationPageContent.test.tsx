import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { evaluation } from "@/features/roleplays/data/evaluation";
import { getGlobalCoachDebriefTitle, SyntheseTab } from "./EvaluationPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/roleplays/roleplay-1/evaluation",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

describe("SyntheseTab", () => {
    it("offers the persona and global coach conversations beside their respective feedback", () => {
        const html = renderToStaticMarkup(
            <SyntheseTab
                evaluation={evaluation}
                onAskPersona={() => undefined}
                onDebrief={() => undefined}
                stepsHref="/roleplays/roleplay-1/steps"
            />,
        );

        expect(html).toContain("Ask AI persona");
        expect(html).toContain("Appréciation globale par le coach IA");
        expect(html).toContain("Ask Coach IA");
        expect(html).toContain("Plan de progrès et priorité stratégique");
        expect(html).toContain("Priorité stratégique");
    });

    it("builds the global coach page title from the associated coach and roleplay", () => {
        expect(
            getGlobalCoachDebriefTitle({
                coachName: "Coach LIA",
                name: "Sophie Martin",
                title: "Présenter MAIA COACH pour caler une DEMO",
            }),
        ).toBe("Débrief avec mon coach LIA - Roleplay Présenter MAIA COACH pour caler une DEMO");
    });
});
