import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createMethod: vi.fn(),
    duplicateMethodKnowledgeQuiz: vi.fn(),
    getMethodById: vi.fn(),
    principalQuizResult: vi.fn(),
    requireAdmin: vi.fn(),
    resolveDuplicateName: vi.fn(),
    rollbackMethod: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/features/content/server", () => ({
    resolveDuplicateName: mocks.resolveDuplicateName,
}));
vi.mock("@/features/evaluations/server/duplicate-quiz", () => ({
    duplicateMethodKnowledgeQuiz: mocks.duplicateMethodKnowledgeQuiz,
}));
vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));
vi.mock("./create-method", () => ({ createMethod: mocks.createMethod }));
vi.mock("./get-method-by-id", () => ({ getMethodById: mocks.getMethodById }));

import {
    buildDuplicatedMethodStepIdMap,
    duplicateMethod,
} from "./duplicate-method";

function queryBuilder() {
    const builder = {
        eq: () => builder,
        maybeSingle: mocks.principalQuizResult,
        neq: () => builder,
        select: () => builder,
    };

    return builder;
}

const sourceMethod = {
    category: "Prospection",
    challenges: ["Qualifier"],
    description: "Description",
    domain: "Commerce et développement commercial",
    id: "method-source",
    name: "Méthode source",
    objectives: ["Découvrir"],
    organizationId: null,
    readingTimeMinutes: 10,
    resources: [],
    scope: "public",
    steps: [{
        bestPractices: [],
        code: "A",
        icon: "search",
        id: "source-step",
        objectives: [],
        order: 1,
        pitfalls: [],
        posture: [],
        resources: [],
        shortTitle: "Découvrir",
        stepKey: "discover",
        summary: "Résumé",
        takeaway: "À retenir",
        title: "Découvrir",
        verbatims: [],
    }],
    subtitle: "Sous-titre",
    tag: "Vente",
};

const duplicatedMethod = {
    ...sourceMethod,
    id: "method-duplicate",
    steps: [{
        ...sourceMethod.steps[0],
        id: "duplicate-step",
    }],
};

describe("buildDuplicatedMethodStepIdMap", () => {
    it("matches duplicated steps by stable key before their order", () => {
        const result = buildDuplicatedMethodStepIdMap(
            [
                { id: "source-a", order: 1, stepKey: "a" },
                { id: "source-b", order: 2, stepKey: "b" },
            ],
            [
                { id: "duplicate-b", order: 1, stepKey: "b" },
                { id: "duplicate-a", order: 2, stepKey: "a" },
            ],
        );

        expect([...result]).toEqual([
            ["source-a", "duplicate-a"],
            ["source-b", "duplicate-b"],
        ]);
    });

    it("falls back to the canonical order when a legacy step has no key", () => {
        const result = buildDuplicatedMethodStepIdMap(
            [{ id: "source-a", order: 1, stepKey: "" }],
            [{ id: "duplicate-a", order: 1, stepKey: "generated-a" }],
        );

        expect(result.get("source-a")).toBe("duplicate-a");
    });
});

describe("duplicateMethod", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
        mocks.resolveDuplicateName.mockResolvedValue("Méthode source - copie");
        mocks.getMethodById.mockResolvedValue(sourceMethod);
        mocks.createMethod.mockResolvedValue(duplicatedMethod);
        mocks.duplicateMethodKnowledgeQuiz.mockResolvedValue({ id: "quiz-duplicate" });
        mocks.principalQuizResult.mockResolvedValue({
            data: { id: "quiz-source" },
            error: null,
        });
        mocks.rollbackMethod.mockResolvedValue({ error: null });
        mocks.createAdminClient.mockReturnValue({
            from(table: string) {
                if (table === "quizzes") return queryBuilder();
                if (table === "methods") {
                    return {
                        delete: () => ({ eq: mocks.rollbackMethod }),
                    };
                }
                throw new Error(`Unexpected table: ${table}`);
            },
        });
    });

    it("duplicates the principal quiz and remaps its method steps", async () => {
        await expect(duplicateMethod("method-source")).resolves.toBe(duplicatedMethod);

        expect(mocks.createMethod).toHaveBeenCalledWith(expect.objectContaining({
            name: "Méthode source - copie",
            quizId: null,
            status: "draft",
        }));
        expect(mocks.duplicateMethodKnowledgeQuiz).toHaveBeenCalledWith({
            methodId: "method-duplicate",
            methodStepIdBySourceId: new Map([
                ["source-step", "duplicate-step"],
            ]),
            quizId: "quiz-source",
        });
    });

    it("keeps a duplicated method without a quiz when the source has none", async () => {
        mocks.principalQuizResult.mockResolvedValue({ data: null, error: null });

        await expect(duplicateMethod("method-source")).resolves.toBe(duplicatedMethod);
        expect(mocks.duplicateMethodKnowledgeQuiz).not.toHaveBeenCalled();
    });

    it("removes the incomplete method when duplicating its quiz fails", async () => {
        mocks.duplicateMethodKnowledgeQuiz.mockRejectedValue(new Error("Quiz failure"));

        await expect(duplicateMethod("method-source")).rejects.toThrow("Quiz failure");
        expect(mocks.rollbackMethod).toHaveBeenCalledWith("id", "method-duplicate");
    });
});
