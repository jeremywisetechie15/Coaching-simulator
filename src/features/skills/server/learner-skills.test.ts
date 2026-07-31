import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SkillDetail } from "@/features/skills/domain/skills";
import type { UserSkillProgress } from "@/features/users/domain/users";
import { NotFoundError } from "@/lib/server/errors";
import {
    getCurrentSkillPageData,
    listSkillsForCurrentUser,
} from "./learner-skills";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    fetchSkillDetail: vi.fn(),
    getSkillById: vi.fn(),
    listCurrentUserAssignedContentIds: vi.fn(),
    listCurrentUserSkillProgresses: vi.fn(),
    listUserSkillProgresses: vi.fn(),
    listSkills: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAuth: mocks.requireAuth,
}));
vi.mock("@/features/users/server", () => ({
    listCurrentUserAssignedContentIds: mocks.listCurrentUserAssignedContentIds,
    listCurrentUserSkillProgresses: mocks.listCurrentUserSkillProgresses,
    listUserSkillProgresses: mocks.listUserSkillProgresses,
}));
vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));
vi.mock("./skill-query", () => ({
    fetchSkillDetail: mocks.fetchSkillDetail,
}));
vi.mock("./get-skill-by-id", () => ({
    getSkillById: mocks.getSkillById,
}));
vi.mock("./list-skills", () => ({
    listSkills: mocks.listSkills,
}));

const progress: UserSkillProgress = {
    delta: 0,
    dimensions: [
        { itemCount: 1, key: "savoir", label: "Savoir", score: 64 },
        { itemCount: 0, key: "savoir_faire", label: "Savoir-faire", score: null },
        { itemCount: 0, key: "savoir_etre", label: "Savoir-être", score: null },
    ],
    id: "skill-roleplay",
    initialScore: 64,
    items: [],
    label: "Compétence roleplay",
    score: 64,
};

function skillRow(id: string, name: string) {
    return {
        assigned_user_id: null,
        category: "Prospection",
        description: `${name} description`,
        domain: "Commercial",
        group_id: null,
        id,
        is_active: true,
        name,
        organization_id: null,
        skill_type: "Métier",
        status: CONTENT_STATUS.published,
        visibility_scope: CONTENT_VISIBILITY_SCOPE.public,
    };
}

function createSupabaseMock() {
    const inCalls: Array<{ column: string; table: string; values: string[] }> = [];
    let skillsQueryCount = 0;

    const rowsByTable = {
        quiz_questions: [{ competence_id: "skill-quiz" }],
        quiz_step_competencies: [{ competence_id: "skill-quiz" }],
        quiz_steps: [{ id: "quiz-step-1" }],
        scenarios: [{ scorecard_id: "scorecard-1" }],
        scorecard_criteria: [{ skill_id: "skill-roleplay" }],
        scorecard_steps: [{ id: "scorecard-step-1" }],
    } as const;

    const from = vi.fn((table: string) => {
        const query: Record<string, ReturnType<typeof vi.fn>> = {};

        query.select = vi.fn(() => query);
        query.eq = vi.fn(() => query);
        query.in = vi.fn((column: string, values: string[]) => {
            inCalls.push({ column, table, values });
            return query;
        });
        query.order = vi.fn(() => query);
        query.returns = vi.fn(async () => {
            if (table === "skills") {
                skillsQueryCount += 1;

                return skillsQueryCount === 1
                    ? { data: [{ id: "skill-direct" }], error: null }
                    : {
                          data: [
                              skillRow("skill-direct", "Compétence directe"),
                              skillRow("skill-roleplay", "Compétence roleplay"),
                              skillRow("skill-quiz", "Compétence quiz"),
                          ],
                          error: null,
                      };
            }

            return {
                data: rowsByTable[table as keyof typeof rowsByTable] ?? [],
                error: null,
            };
        });

        return query;
    });

    mocks.createAdminClient.mockReturnValue({ from });

    return { inCalls };
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuth.mockResolvedValue({
        platformRole: "user",
        userId: "user-1",
    });
    mocks.listCurrentUserAssignedContentIds.mockResolvedValue({
        quizIds: ["quiz-1"],
        roleplayIds: ["roleplay-1"],
        userId: "user-1",
    });
    mocks.listCurrentUserSkillProgresses.mockResolvedValue([progress]);
    mocks.listUserSkillProgresses.mockResolvedValue([]);
});

describe("learner skills", () => {
    it("returns only skills assigned directly or through assigned content", async () => {
        const { inCalls } = createSupabaseMock();

        const skills = await listSkillsForCurrentUser();

        expect(skills.map((skill) => skill.id)).toEqual([
            "skill-direct",
            "skill-roleplay",
            "skill-quiz",
        ]);
        expect(inCalls).toContainEqual({
            column: "id",
            table: "skills",
            values: ["skill-direct", "skill-roleplay", "skill-quiz"],
        });
    });

    it("keeps the complete skill catalogue available to admins", async () => {
        const adminSkills = [
            skillRow("skill-with-progress", "Compétence évaluée"),
            skillRow("skill-without-progress", "Compétence non évaluée"),
        ];
        mocks.requireAuth.mockResolvedValue({
            platformRole: "admin",
            userId: "admin-1",
        });
        mocks.listSkills.mockResolvedValue(adminSkills);

        await expect(listSkillsForCurrentUser()).resolves.toEqual(adminSkills);

        expect(mocks.listSkills).toHaveBeenCalledOnce();
        expect(mocks.listCurrentUserAssignedContentIds).not.toHaveBeenCalled();
    });

    it("exposes an admin's own progress on a skill detail", async () => {
        const detail = {
            ...skillRow("skill-roleplay", "Compétence roleplay"),
            assignedUserId: null,
            dimensionItems: [],
            groupId: null,
            scope: CONTENT_VISIBILITY_SCOPE.public,
            type: "Métier",
        } as unknown as SkillDetail;
        mocks.requireAuth.mockResolvedValue({
            platformRole: "admin",
            userId: "admin-1",
        });
        mocks.getSkillById.mockResolvedValue(detail);
        mocks.listUserSkillProgresses.mockResolvedValue([progress]);

        await expect(getCurrentSkillPageData("skill-roleplay")).resolves.toEqual({
            progress,
            skill: detail,
        });

        expect(mocks.listUserSkillProgresses).toHaveBeenCalledWith("admin-1");
        expect(mocks.listCurrentUserSkillProgresses).not.toHaveBeenCalled();
    });

    it("keeps an unevaluated skill detail available to admins", async () => {
        const detail = {
            ...skillRow("skill-without-progress", "Compétence non évaluée"),
            assignedUserId: null,
            dimensionItems: [],
            groupId: null,
            scope: CONTENT_VISIBILITY_SCOPE.public,
            type: "Métier",
        } as unknown as SkillDetail;
        mocks.requireAuth.mockResolvedValue({
            platformRole: "admin",
            userId: "admin-1",
        });
        mocks.getSkillById.mockResolvedValue(detail);

        await expect(getCurrentSkillPageData("skill-without-progress")).resolves.toEqual({
            progress: null,
            skill: detail,
        });
    });

    it("exposes real progress only for an assigned skill detail", async () => {
        createSupabaseMock();
        const detail = {
            ...skillRow("skill-roleplay", "Compétence roleplay"),
            assignedUserId: null,
            category: "Prospection",
            dimensionItems: [],
            groupId: null,
            isActive: true,
            organizationId: null,
            scope: CONTENT_VISIBILITY_SCOPE.public,
            type: "Métier",
        } as unknown as SkillDetail;
        mocks.fetchSkillDetail.mockResolvedValue(detail);

        await expect(getCurrentSkillPageData("skill-roleplay")).resolves.toEqual({
            progress,
            skill: detail,
        });
    });

    it("rejects a visible but unassigned skill detail", async () => {
        createSupabaseMock();

        await expect(getCurrentSkillPageData("skill-unassigned"))
            .rejects.toBeInstanceOf(NotFoundError);
        expect(mocks.fetchSkillDetail).not.toHaveBeenCalled();
    });
});
