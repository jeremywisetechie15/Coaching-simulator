import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { buildDuplicateRoleplayInput } from "./duplicate-roleplay";

describe("buildDuplicateRoleplayInput", () => {
    it("copies private scenario instructions into the duplicated draft", () => {
        const input = buildDuplicateRoleplayInput({
            aiInstructions: "Conserve cette objection jusqu'à la phase de découverte.",
            duplicatePreviewTitle: "Aperçu (copie)",
            duplicateTitle: "Scénario (copie)",
            quizRows: [{
                participation: "mandatory",
                quiz_id: "77777777-7777-4777-8777-777777777777",
            }],
            source: {
                assignedUserId: null,
                category: "Prospection",
                coachId: "22222222-2222-4222-8222-222222222222",
                context: "Premier appel.",
                description: "Description",
                difficulty: "Moyen",
                disc: "Stable",
                domain: "Commercial",
                groupId: null,
                methodId: "33333333-3333-4333-8333-333333333333",
                objective: "Obtenir un rendez-vous.",
                obstacles: "Manque de temps.",
                organizationId: null,
                personaId: "11111111-1111-4111-8111-111111111111",
                previewDescription: "Aperçu",
                resources: [],
                scope: CONTENT_VISIBILITY_SCOPE.public,
                scorecardId: "44444444-4444-4444-8444-444444444444",
            },
        });

        expect(input.aiInstructions).toBe("Conserve cette objection jusqu'à la phase de découverte.");
        expect(input.status).toBe(CONTENT_STATUS.draft);
        expect(input.title).toBe("Scénario (copie)");
        expect(input.quizIds).toEqual(["77777777-7777-4777-8777-777777777777"]);
        expect(input.quizParticipation).toBe("mandatory");
    });
});
