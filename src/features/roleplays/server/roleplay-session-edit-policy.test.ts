import { describe, expect, it } from "vitest";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { ROLEPLAY_SESSION_EDIT_RESTRICTION_MESSAGE } from "@/features/roleplays/domain";
import { assertRoleplaySessionEditPolicy } from "./roleplay-session-edit-policy";

type FakeRow = Record<string, unknown>;

class FakeQuery implements PromiseLike<{
    count: number | null;
    data: FakeRow[] | null;
    error: null;
}> {
    private countOnly = false;
    private readonly filters: Array<(row: FakeRow) => boolean> = [];

    constructor(private readonly rows: FakeRow[]) {}

    select(_columns: string, options?: { count?: string; head?: boolean }) {
        this.countOnly = options?.head === true;
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push((row) => row[column] === value);
        return this;
    }

    order() {
        return this;
    }

    returns() {
        return this;
    }

    maybeSingle() {
        const rows = this.filteredRows();
        return Promise.resolve({
            count: null,
            data: rows[0] ?? null,
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

function createFakeSupabase(rowsByTable: Record<string, FakeRow[]>) {
    return {
        from(table: string) {
            return new FakeQuery(rowsByTable[table] ?? []);
        },
    };
}

const roleplayId = "roleplay-1";
const currentScenario = {
    assigned_user_id: null,
    background_image_path: null,
    category: "Accueil client",
    coach_id: "coach-1",
    difficulty_level: "Moyen",
    disc_profile: "Stable",
    domain: "Relation client",
    group_id: null,
    id: roleplayId,
    method_id: "method-1",
    organization_id: null,
    persona_id: "persona-1",
    scorecard_id: "scorecard-1",
    visibility_scope: "public",
};
const unchangedInput = {
    assignedUserId: null,
    backgroundImagePath: "",
    category: "Accueil client",
    coachId: "coach-1",
    difficulty: "Moyen",
    disc: "Stable",
    domain: "Relation client",
    groupId: null,
    methodId: "method-1",
    organizationId: null,
    personaId: "persona-1",
    quizIds: [],
    quizParticipation: "optional",
    resources: [],
    scope: "public",
    scorecardId: "scorecard-1",
    status: "published",
    title: "Titre textuel modifié",
} as unknown as SaveRoleplayDto;

function baseRows(hasSessions: boolean) {
    return {
        scenario_quizzes: [],
        scenario_resources: [],
        scenarios: [currentScenario],
        sessions: hasSessions ? [{ id: "session-1", scenario_id: roleplayId }] : [],
    };
}

describe("roleplay session edit policy server guard", () => {
    it("allows text-only changes after a session", async () => {
        await expect(
            assertRoleplaySessionEditPolicy(
                createFakeSupabase(baseRows(true)) as never,
                roleplayId,
                unchangedInput,
            ),
        ).resolves.toBeUndefined();
    });

    it("allows duration and validation threshold changes after a session", async () => {
        await expect(
            assertRoleplaySessionEditPolicy(
                createFakeSupabase(baseRows(true)) as never,
                roleplayId,
                {
                    ...unchangedInput,
                    estimatedDurationMinutes: 15,
                    validationThreshold: 72,
                },
            ),
        ).resolves.toBeUndefined();
    });

    it("rejects a locked configuration change after a session", async () => {
        await expect(
            assertRoleplaySessionEditPolicy(
                createFakeSupabase(baseRows(true)) as never,
                roleplayId,
                {
                    ...unchangedInput,
                    methodId: "method-2",
                },
            ),
        ).rejects.toMatchObject({
            message: ROLEPLAY_SESSION_EDIT_RESTRICTION_MESSAGE,
            status: 409,
        });
    });

    it("allows configuration changes before the first session", async () => {
        await expect(
            assertRoleplaySessionEditPolicy(
                createFakeSupabase(baseRows(false)) as never,
                roleplayId,
                {
                    ...unchangedInput,
                    methodId: "method-2",
                },
            ),
        ).resolves.toBeUndefined();
    });
});
