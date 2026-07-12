import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Method, MethodStep } from "@/features/methods/data/methods";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { RoleplayStepCoachPageContent } from "./RoleplayStepCoachPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/roleplays/roleplay-1/steps/1",
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

const step: MethodStep = {
    bonnesPratiques: ["Bonne pratique réelle"],
    capsule: { duration: "3 min", title: "Capsule" },
    erreurs: ["Écueil réel"],
    icon: "phone",
    objectifs: ["Objectif réel de l'étape"],
    posture: ["Posture réelle"],
    summary: "Résumé",
    title: "Ouverture",
    verbatims: ["Verbatim réel"],
};

const method: Method = {
    category: "Commercial",
    description: "Description",
    enjeux: [],
    id: "method-1",
    name: "Méthode test",
    objectifMetier: "",
    objectifs: [],
    quizQuestions: 0,
    readingTime: "5 min",
    retenir: [],
    steps: [step],
    subtitle: "",
};

const roleplay: RoleplayItem = {
    avatarSrc: "",
    category: "Prospection",
    company: "MaiaCoach",
    description: "Description",
    detail: {
        context: "Contexte",
        infoChips: [],
        lastDate: "Aucune session",
        lastDuration: "0s",
        meilleurScore: 0,
        method: "Méthode test",
        objections: "",
        scoreActuel: 0,
        simulations: 0,
    },
    difficulty: "Moyen",
    disc: "Stable",
    domain: "Commercial",
    id: "roleplay-1",
    methodId: "method-1",
    name: "Persona test",
    role: "Dirigeant",
    scenarioId: "scenario-1",
};

describe("RoleplayStepCoachPageContent", () => {
    it("uses the five shared method-step sections and displays the selected step data", () => {
        const html = renderToStaticMarkup(
            <RoleplayStepCoachPageContent
                coachSessionId="c1295bce-cbe8-4b2c-965b-2ba64a865d1e"
                method={method}
                roleplay={roleplay}
                step={step}
                stepNumber={1}
            />,
        );

        expect(html).toContain("Objectifs et enjeux");
        expect(html).toContain("Bonnes pratiques");
        expect(html).toContain("Écueils à éviter");
        expect(html).toContain("Posture &amp; Communication");
        expect(html).toContain("Verbatims préconisés");
        expect(html).toContain("Objectif réel de l&#x27;étape");
        expect(html).not.toContain("Conseils de préparation");
        expect(html).not.toContain("Pièges à éviter");
    });

    it("keeps the evaluated session when opening after-training coaching", () => {
        const html = renderToStaticMarkup(
            <RoleplayStepCoachPageContent
                coachSessionId="c1295bce-cbe8-4b2c-965b-2ba64a865d1e"
                method={method}
                referenceSessionId="1fef1dae-97db-4bce-9624-88bf84306db8"
                roleplay={roleplay}
                step={step}
                stepNumber={1}
                variant="improve"
            />,
        );

        expect(html).toContain("coach_mode=after_training");
        expect(html).toContain("ref_session_id=1fef1dae-97db-4bce-9624-88bf84306db8");
    });
});
