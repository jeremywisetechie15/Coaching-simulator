import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { evaluation } from "@/features/roleplays/data/evaluation";
import { roleplays } from "@/features/roleplays/data/roleplays";
import { roleplaySessions } from "@/features/roleplays/data/sessions";
import { uiTokens } from "@/lib/ui/tokens";
import {
    EvaluationPageContent,
    getCoachFeedbackTitle,
    getEvaluationNotesCoachMode,
    getGlobalCoachDebriefTitle,
    SyntheseTab,
} from "./EvaluationPageContent";

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
    it("exposes a pointer cursor for every enabled page interaction", () => {
        const html = renderToStaticMarkup(
            <EvaluationPageContent
                evaluation={evaluation}
                roleplay={roleplays[0]}
                session={roleplaySessions[0]}
            />,
        );
        const renderedButtons = html.match(/<button\b[^>]*>/g) ?? [];

        expect(uiTokens.interaction.button).toContain("cursor-pointer");
        expect(uiTokens.interaction.button).toContain("disabled:cursor-not-allowed");
        expect(renderedButtons.length).toBeGreaterThan(0);
        expect(renderedButtons.every((button) => button.includes("cursor-pointer"))).toBe(true);
    });

    it("offers the persona and global coach conversations beside their respective feedback", () => {
        const html = renderToStaticMarkup(
            <SyntheseTab
                evaluation={evaluation}
                onAskPersona={() => undefined}
                onAskCoach={() => undefined}
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

    it("builds a distinct title for the concise coach feedback", () => {
        expect(
            getCoachFeedbackTitle({
                coachName: "Coach LIA",
                name: "Sophie Martin",
                title: "Présenter MAIA COACH pour caler une DEMO",
            }),
        ).toBe("Avis de mon coach LIA - Roleplay Présenter MAIA COACH pour caler une DEMO");
    });

    it("isolates notes with a dedicated persisted mode for every evaluation conversation", () => {
        expect(getEvaluationNotesCoachMode("coachFeedback")).toBe("feedback");
        expect(getEvaluationNotesCoachMode("persona")).toBe("persona_feedback");
        expect(getEvaluationNotesCoachMode("coachDebrief")).toBe("notation");
    });
});
