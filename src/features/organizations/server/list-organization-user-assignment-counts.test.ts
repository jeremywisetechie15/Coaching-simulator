import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    listOrganizationContentScope: vi.fn(),
}));

vi.mock("./list-organization-content-scope", () => ({
    listOrganizationContentScope: mocks.listOrganizationContentScope,
}));

import {
    listOrganizationUserAssignmentCounts,
    resolveBatchRoleplayDerivedQuizAssignments,
} from "./list-organization-user-assignment-counts";

function createScopeSnapshot() {
    return {
        quizIdsByGroupUserId: new Map([
            ["group-a", new Map([
                ["user-a", new Set(["group-quiz"])],
                ["user-b", new Set(["group-quiz"])],
            ])],
        ]),
        quizIdsByOrganizationUserId: new Map([
            ["organization-a", new Map([
                ["user-a", new Set(["organization-quiz", "explicit-quiz", "derived-quiz"])],
                ["user-b", new Set(["organization-quiz", "group-quiz"])],
            ])],
        ]),
        roleplayIdsByGroupUserId: new Map([
            ["group-a", new Map([
                ["user-a", new Set(["group-roleplay"])],
                ["user-b", new Set(["group-roleplay"])],
            ])],
        ]),
        roleplayIdsByOrganizationUserId: new Map([
            ["organization-a", new Map([
                ["user-a", new Set(["organization-roleplay", "direct-roleplay", "explicit-roleplay"])],
                ["user-b", new Set(["organization-roleplay", "group-roleplay"])],
            ])],
        ]),
    };
}

describe("organization user assignment counts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.listOrganizationContentScope.mockResolvedValue(createScopeSnapshot());
    });

    it("returns organization-context counts without adding global public content", async () => {
        const client = { from: vi.fn() };

        await expect(listOrganizationUserAssignmentCounts(client as never, {
            kind: "organization",
            organizationId: "organization-a",
            userIds: ["user-a", "user-b", "user-a"],
        })).resolves.toEqual(new Map([
            ["user-a", { quizCount: 3, roleplayCount: 3 }],
            ["user-b", { quizCount: 2, roleplayCount: 2 }],
        ]));

        expect(mocks.listOrganizationContentScope).toHaveBeenCalledWith(client, ["organization-a"]);
    });

    it("returns only content targeted through the selected group", async () => {
        await expect(listOrganizationUserAssignmentCounts({} as never, {
            groupId: "group-a",
            kind: "group",
            organizationId: "organization-a",
            userIds: ["user-a", "user-b"],
        })).resolves.toEqual(new Map([
            ["user-a", { quizCount: 1, roleplayCount: 1 }],
            ["user-b", { quizCount: 1, roleplayCount: 1 }],
        ]));
    });

    it("derives linked and method-knowledge quizzes from active explicitly assigned roleplays", () => {
        expect(
            resolveBatchRoleplayDerivedQuizAssignments({
                methodQuizRows: [{ id: "quiz-method", method_id: "method-1" }],
                scenarioAssignments: [
                    { assigned_at: "2026-07-16T12:00:00.000Z", scenario_id: "scenario-1", user_id: "user-a" },
                    { assigned_at: "2026-07-16T12:00:00.000Z", scenario_id: "scenario-1", user_id: "user-b" },
                    { assigned_at: "2026-07-16T12:00:00.000Z", scenario_id: "scenario-draft", user_id: "user-a" },
                ],
                scenarioQuizRows: [
                    { quiz_id: "quiz-1", scenario_id: "scenario-1" },
                    { quiz_id: "quiz-draft", scenario_id: "scenario-draft" },
                ],
                scenarioRows: [
                    { id: "scenario-1", method_id: "method-1" },
                ],
                userIds: ["user-a", "user-b"],
            }),
        ).toEqual([
            { contentId: "quiz-1", userId: "user-a" },
            { contentId: "quiz-method", userId: "user-a" },
            { contentId: "quiz-1", userId: "user-b" },
            { contentId: "quiz-method", userId: "user-b" },
        ]);
    });
});
