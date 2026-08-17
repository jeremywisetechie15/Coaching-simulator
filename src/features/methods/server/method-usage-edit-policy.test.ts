import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MethodDetail } from "@/features/methods/domain/method";
import { METHOD_USAGE_EDIT_RESTRICTION_MESSAGE } from "@/features/methods/domain/method";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";

const mocks = vi.hoisted(() => ({
    fetchMethodDetail: vi.fn(),
    hasRoleplaySessionsForScenarioDependency: vi.fn(),
}));

vi.mock("@/features/content/server", () => ({
    hasRoleplaySessionsForScenarioDependency:
        mocks.hasRoleplaySessionsForScenarioDependency,
}));
vi.mock("./method-query", () => ({
    fetchMethodDetail: mocks.fetchMethodDetail,
}));

import { assertMethodUsageEditPolicy } from "./method-usage-edit-policy";

type FakeRow = Record<string, unknown>;

class FakeQuery implements PromiseLike<{
    count: number | null;
    data: FakeRow[] | null;
    error: null;
}> {
    private countOnly = false;
    private readonly filters: Array<(row: FakeRow) => boolean> = [];

    constructor(private readonly rows: FakeRow[]) {}

    select(_columns: string, options?: { head?: boolean }) {
        this.countOnly = options?.head === true;
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push((row) => row[column] === value);
        return this;
    }

    maybeSingle() {
        return Promise.resolve({
            count: null,
            data: this.filteredRows()[0] ?? null,
            error: null,
        });
    }

    then<TResult1 = {
        count: number | null;
        data: FakeRow[] | null;
        error: null;
    }, TResult2 = never>(
        onfulfilled?: ((value: {
            count: number | null;
            data: FakeRow[] | null;
            error: null;
        }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        const rows = this.filteredRows();
        return Promise.resolve({
            count: this.countOnly ? rows.length : null,
            data: this.countOnly ? null : rows,
            error: null,
        } as const).then(onfulfilled, onrejected);
    }

    private filteredRows() {
        return this.rows.filter((row) => this.filters.every((filter) => filter(row)));
    }
}

function createFakeSupabase(hasQuizAttempts: boolean) {
    const rowsByTable: Record<string, FakeRow[]> = {
        quiz_attempts: hasQuizAttempts
            ? [{ id: "attempt-1", "quizzes.method_id": methodId }]
            : [],
        quizzes: [{
            id: quizId,
            method_id: methodId,
            quiz_kind: "method_knowledge",
        }],
    };

    return {
        from(table: string) {
            return new FakeQuery(rowsByTable[table] ?? []);
        },
    };
}

const methodId = "11111111-1111-4111-8111-111111111111";
const stepId = "22222222-2222-4222-8222-222222222222";
const resourceId = "33333333-3333-4333-8333-333333333333";
const quizId = "44444444-4444-4444-8444-444444444444";

function currentMethod(): MethodDetail {
    return {
        category: "Prospection",
        challenges: ["Créer de l'intérêt"],
        code: "DAGO",
        description: "Description initiale",
        domain: "Commerce et développement commercial",
        id: methodId,
        name: "Méthode initiale",
        notationMethodId: null,
        objectives: ["Obtenir un rendez-vous"],
        organizationId: null,
        organizationName: null,
        readingTimeLabel: "10 min",
        readingTimeMinutes: 10,
        resources: [{
            durationSeconds: null,
            externalUrl: "https://example.com/initial",
            id: resourceId,
            label: "Ressource initiale",
            notationFileId: null,
            resourceType: "link",
            sortOrder: 1,
            stepId: null,
            storageBucket: null,
            storagePath: null,
        }],
        scope: "public",
        status: "published",
        stepCount: 1,
        steps: [{
            bestPractices: ["Être concis"],
            code: "ACC",
            icon: "phone",
            id: stepId,
            objectives: ["Capter l'attention"],
            order: 1,
            pitfalls: ["Être trop long"],
            posture: ["Dynamique"],
            resources: [],
            shortTitle: "Accroche",
            stepKey: "accroche",
            summary: "Résumé initial",
            takeaway: "À retenir",
            title: "Accrocher",
            verbatims: ["Bonjour"],
            weight: null,
        }],
        subtitle: "Sous-titre initial",
        tag: "Initial",
        version: "v1",
    };
}

function unchangedInput(): SaveMethodDto {
    return {
        category: "Prospection",
        challenges: ["Créer de l'intérêt"],
        description: "Description initiale",
        domain: "Commerce et développement commercial",
        name: "Méthode initiale",
        objectives: ["Obtenir un rendez-vous"],
        organizationId: null,
        quizId,
        readingTimeMinutes: 10,
        resources: [{
            clientFileId: "",
            externalUrl: "https://example.com/initial",
            id: resourceId,
            label: "Ressource initiale",
            resourceType: "link",
            storageBucket: "",
            storagePath: "",
        }],
        scope: "public",
        status: "published",
        steps: [{
            bestPractices: ["Être concis"],
            code: "ACC",
            icon: "phone",
            id: stepId,
            objectives: ["Capter l'attention"],
            pitfalls: ["Être trop long"],
            posture: ["Dynamique"],
            resources: [],
            shortTitle: "Accroche",
            stepKey: "accroche",
            summary: "Résumé initial",
            takeaway: "À retenir",
            title: "Accrocher",
            verbatims: ["Bonjour"],
        }],
        subtitle: "Sous-titre initial",
        tag: "Initial",
    };
}

describe("method usage edit policy server guard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.fetchMethodDetail.mockResolvedValue(currentMethod());
        mocks.hasRoleplaySessionsForScenarioDependency.mockResolvedValue(false);
    });

    it("allows existing text and numeric values to change after usage", async () => {
        const input = unchangedInput();
        input.name = "Méthode renommée";
        input.description = "Description modifiée";
        input.readingTimeMinutes = 15;
        input.objectives = ["Nouvel objectif"];
        input.challenges = ["Nouvel enjeu"];
        input.resources[0]!.label = "Ressource renommée";
        input.resources[0]!.externalUrl = "https://example.com/nouveau";
        input.steps[0]!.title = "Nouvelle accroche";
        input.steps[0]!.summary = "Nouveau résumé";
        input.steps[0]!.objectives = ["Objectif reformulé"];
        input.steps[0]!.verbatims = ["Nouvelle formulation"];

        await expect(
            assertMethodUsageEditPolicy(
                createFakeSupabase(true) as never,
                methodId,
                input,
            ),
        ).resolves.toBe(true);
    });

    it("rejects selections and list structure changes after usage", async () => {
        const input = unchangedInput();
        input.domain = "Relation client et expérience client";
        input.steps[0]!.objectives.push("Un objectif en plus");

        await expect(
            assertMethodUsageEditPolicy(
                createFakeSupabase(true) as never,
                methodId,
                input,
            ),
        ).rejects.toMatchObject({
            message: METHOD_USAGE_EDIT_RESTRICTION_MESSAGE,
            status: 409,
        });
    });

    it("allows the principal quiz association to change after usage", async () => {
        const input = unchangedInput();
        input.quizId = "55555555-5555-4555-8555-555555555555";

        await expect(
            assertMethodUsageEditPolicy(
                createFakeSupabase(true) as never,
                methodId,
                input,
            ),
        ).resolves.toBe(true);
    });

    it("rejects uploads after usage", async () => {
        await expect(
            assertMethodUsageEditPolicy(
                createFakeSupabase(true) as never,
                methodId,
                unchangedInput(),
                { hasUploads: true },
            ),
        ).rejects.toMatchObject({
            message: METHOD_USAGE_EDIT_RESTRICTION_MESSAGE,
            status: 409,
        });
    });

    it("allows structural changes before the first usage", async () => {
        const input = unchangedInput();
        input.steps = [];

        await expect(
            assertMethodUsageEditPolicy(
                createFakeSupabase(false) as never,
                methodId,
                input,
                { hasUploads: true },
            ),
        ).resolves.toBe(false);
        expect(mocks.fetchMethodDetail).not.toHaveBeenCalled();
    });
});
