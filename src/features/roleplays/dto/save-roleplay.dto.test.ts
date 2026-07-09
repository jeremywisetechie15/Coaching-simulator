import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { saveRoleplayDto, type SaveRoleplayInput } from "./save-roleplay.dto";

const personaId = "11111111-1111-4111-8111-111111111111";
const coachId = "22222222-2222-4222-8222-222222222222";
const methodId = "33333333-3333-4333-8333-333333333333";
const organizationId = "44444444-4444-4444-8444-444444444444";
const groupId = "55555555-5555-4555-8555-555555555555";
const userId = "66666666-6666-4666-8666-666666666666";
const scorecardId = "77777777-7777-4777-8777-777777777777";

function roleplay(overrides: Partial<SaveRoleplayInput> = {}): SaveRoleplayInput {
    return {
        category: "Prise de rendez-vous",
        coachId,
        context: "Appel de prospection.",
        description: "Décrocher un rendez-vous.",
        difficulty: "Moyen",
        domain: "Commercial",
        methodId,
        objective: "Obtenir un créneau.",
        personaId,
        previewDescription: "Résumé court sur la carte.",
        previewTitle: "Décrocher un premier rendez-vous",
        scope: CONTENT_VISIBILITY_SCOPE.public,
        status: CONTENT_STATUS.published,
        title: "Rendez-vous prospect",
        ...overrides,
    };
}

describe("saveRoleplayDto", () => {
    it("accepts a public roleplay with linked quizzes", () => {
        const result = saveRoleplayDto.parse(
            roleplay({
                quizIds: ["77777777-7777-4777-8777-777777777777"],
                resources: [
                    {
                        clientFileId: "scenario-file-1",
                        label: "Présentation produit",
                        resourceType: "document",
                    },
                ],
                scorecardId,
            }),
        );

        expect(result.scope).toBe(CONTENT_VISIBILITY_SCOPE.public);
        expect(result.quizIds).toEqual(["77777777-7777-4777-8777-777777777777"]);
        expect(result.previewDescription).toBe("Résumé court sur la carte.");
        expect(result.previewTitle).toBe("Décrocher un premier rendez-vous");
        expect(result.scorecardId).toBe(scorecardId);
        expect(result.resources).toEqual([
            expect.objectContaining({
                clientFileId: "scenario-file-1",
                label: "Présentation produit",
                resourceType: "document",
            }),
        ]);
        expect(result.status).toBe(CONTENT_STATUS.published);
    });

    it("deduplicates selected quizzes", () => {
        const result = saveRoleplayDto.parse(
            roleplay({
                quizIds: [
                    "77777777-7777-4777-8777-777777777777",
                    "77777777-7777-4777-8777-777777777777",
                ],
            }),
        );

        expect(result.quizIds).toEqual(["77777777-7777-4777-8777-777777777777"]);
    });

    it("rejects inconsistent uploaded resource locations", () => {
        const result = saveRoleplayDto.safeParse(
            roleplay({
                resources: [
                    {
                        label: "Document produit",
                        resourceType: "document",
                        storagePath: "scenarios/scenario-1/resources/file.pdf",
                    },
                ],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "Le bucket du fichier uploadé est requis.",
        );
    });

    it("requires organization and group targets for group-private roleplays", () => {
        const result = saveRoleplayDto.safeParse(
            roleplay({
                scope: CONTENT_VISIBILITY_SCOPE.group,
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toEqual(
            expect.arrayContaining([
                "Un roleplay privé groupe doit être lié à une organisation.",
                "Un roleplay privé groupe doit être lié à un groupe.",
            ]),
        );
    });

    it("accepts a group-private roleplay", () => {
        const result = saveRoleplayDto.parse(
            roleplay({
                groupId,
                organizationId,
                scope: CONTENT_VISIBILITY_SCOPE.group,
            }),
        );

        expect(result.organizationId).toBe(organizationId);
        expect(result.groupId).toBe(groupId);
    });

    it("requires a user target for user-private roleplays", () => {
        const result = saveRoleplayDto.safeParse(
            roleplay({
                scope: CONTENT_VISIBILITY_SCOPE.user,
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "Un roleplay privé utilisateur doit être lié à un utilisateur.",
        );
    });

    it("accepts a user-private roleplay without forcing an organization", () => {
        const result = saveRoleplayDto.parse(
            roleplay({
                assignedUserId: userId,
                scope: CONTENT_VISIBILITY_SCOPE.user,
            }),
        );

        expect(result.assignedUserId).toBe(userId);
        expect(result.organizationId).toBeNull();
    });

    it("rejects a scorecard without a linked method", () => {
        const result = saveRoleplayDto.safeParse(
            roleplay({
                methodId: null,
                scorecardId,
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "Une scorecard de roleplay doit être liée à une méthode.",
        );
    });
});
