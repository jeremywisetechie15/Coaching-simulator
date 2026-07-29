import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, LEARNER_CONTENT_STATUS } from "@/features/content/domain";
import {
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_NOTE_TYPE,
} from "@/features/roleplays/domain";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { RoleplaySessionPageContent } from "./RoleplaySessionPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/roleplays/roleplay-1/session",
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

const roleplay: RoleplayItem = {
    avatarSrc: "",
    category: "Prospection",
    company: "MaiaCoach",
    description: "Obtenir un rendez-vous.",
    detail: {
        context: "Appel de prospection.",
        infoChips: [],
        lastDate: "Aucune session",
        lastDuration: "0s",
        learnerRole: "Commercial",
        meilleurScore: 0,
        method: "DAGO",
        objections: "",
        scoreActuel: 0,
        simulations: 0,
    },
    difficulty: "Moyen",
    disc: "Stable",
    domain: "Commercial",
    id: "roleplay-1",
    isActive: true,
    learnerStatus: LEARNER_CONTENT_STATUS.todo,
    methodId: "method-1",
    name: "Persona test",
    prepDocuments: [],
    role: "Dirigeant",
    scenarioId: "scenario-1",
    status: CONTENT_STATUS.published,
    validationThreshold: 80,
};

describe("RoleplaySessionPageContent", () => {
    it("shows the real preparation-note count in the recommendation panel", () => {
        const html = renderToStaticMarkup(
            <RoleplaySessionPageContent
                noteGroups={[
                    {
                        coachMode: ROLEPLAY_COACH_MODE.beforeTraining,
                        methodStepId: null,
                        notes: [
                            {
                                content: "Note 1",
                                createdAt: "2026-07-29T14:09:00.000Z",
                                id: "cb27bd22-4207-40aa-92ba-64d01965616f",
                                sourceMessageId: null,
                                type: ROLEPLAY_COACH_NOTE_TYPE.keyPoint,
                            },
                            {
                                content: "Note 2",
                                createdAt: "2026-07-29T14:10:00.000Z",
                                id: "5f25b537-5249-421f-a46a-c851594b84ba",
                                sourceMessageId: null,
                                type: ROLEPLAY_COACH_NOTE_TYPE.suggestion,
                            },
                        ],
                        savedAt: "2026-07-29T14:10:00.000Z",
                        stepOrder: 1,
                        stepTitle: "Ouverture",
                    },
                    {
                        coachMode: ROLEPLAY_COACH_MODE.afterTraining,
                        methodStepId: null,
                        notes: [{
                            content: "Note après entraînement",
                            createdAt: "2026-07-29T15:00:00.000Z",
                            id: "e6651bcf-6429-465d-a14d-aedfc65f4a35",
                            sourceMessageId: null,
                            type: ROLEPLAY_COACH_NOTE_TYPE.example,
                        }],
                        savedAt: "2026-07-29T15:00:00.000Z",
                        stepOrder: 1,
                        stepTitle: "Ouverture",
                    },
                ]}
                roleplay={roleplay}
            />,
        );

        expect(html).toContain("Notes de préparation");
        expect(html).toContain(">2</span>");
        expect(html).not.toContain("Voir les notes de préparation");
    });
});
