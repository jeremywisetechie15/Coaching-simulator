import { describe, expect, it } from "vitest";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import {
    getOrganizationCohortActivityStatus,
    indexOrganizationLearnerActivitiesByContentId,
    resolveOrganizationActivityLearnerIds,
    type OrganizationActivityAudience,
} from "./organization-activity";

const audience: OrganizationActivityAudience = {
    activeGroupMemberIdsByGroupId: new Map([
        ["group-active", ["member-a", "member-b"]],
    ]),
    activeMemberIds: ["member-a", "member-b", "member-c"],
};

describe("resolveOrganizationActivityLearnerIds", () => {
    it("targets every active member for organization content", () => {
        expect(resolveOrganizationActivityLearnerIds({
            activity: {
                organizationId: "organization-1",
                visibilityScope: CONTENT_VISIBILITY_SCOPE.organization,
            },
            audience,
            organizationId: "organization-1",
        })).toEqual(["member-a", "member-b", "member-c"]);
    });

    it("targets only active members of an active group", () => {
        expect(resolveOrganizationActivityLearnerIds({
            activity: {
                groupId: "group-active",
                organizationId: "organization-1",
                visibilityScope: CONTENT_VISIBILITY_SCOPE.group,
            },
            audience,
            organizationId: "organization-1",
        })).toEqual(["member-a", "member-b"]);
    });

    it("does not target members through an inactive or foreign group", () => {
        expect(resolveOrganizationActivityLearnerIds({
            activity: {
                groupId: "group-archived",
                visibilityScope: CONTENT_VISIBILITY_SCOPE.group,
            },
            audience,
            organizationId: "organization-1",
        })).toEqual([]);
    });

    it("keeps only active direct and explicit assignees", () => {
        expect(resolveOrganizationActivityLearnerIds({
            activity: {
                assignedUserId: "member-a",
                visibilityScope: CONTENT_VISIBILITY_SCOPE.user,
            },
            audience,
            explicitAssigneeIds: ["member-b", "invited-member"],
            organizationId: "organization-1",
        })).toEqual(["member-a", "member-b"]);
    });

    it("includes public content only for active explicit assignees", () => {
        expect(resolveOrganizationActivityLearnerIds({
            activity: { visibilityScope: CONTENT_VISIBILITY_SCOPE.public },
            audience,
            explicitAssigneeIds: ["member-c", "suspended-member"],
            organizationId: "organization-1",
        })).toEqual(["member-c"]);
    });

    it("supports historical rows without a normalized visibility scope", () => {
        expect(resolveOrganizationActivityLearnerIds({
            activity: { groupId: "group-active", visibilityScope: null },
            audience,
            organizationId: "organization-1",
        })).toEqual(["member-a", "member-b"]);
    });
});

describe("getOrganizationCohortActivityStatus", () => {
    it("returns completed only when every targeted learner completed", () => {
        expect(getOrganizationCohortActivityStatus(
            ["member-a", "member-b"],
            [
                { status: "completed", userId: "member-a" },
                { status: "in_progress", userId: "member-a" },
                { status: "completed", userId: "member-b" },
            ],
        )).toBe("completed");
    });

    it("returns in progress when only part of the cohort completed", () => {
        expect(getOrganizationCohortActivityStatus(
            ["member-a", "member-b"],
            [{ status: "completed", userId: "member-a" }],
        )).toBe("in_progress");
    });

    it("counts an admissible activity with no status as in progress", () => {
        expect(getOrganizationCohortActivityStatus(
            ["member-a"],
            [{ status: null, userId: "member-a" }],
        )).toBe("in_progress");
    });

    it("ignores activity from learners outside the target cohort", () => {
        expect(getOrganizationCohortActivityStatus(
            ["member-a"],
            [{ status: "completed", userId: "member-outside" }],
        )).toBe("not_started");
    });

    it("does not consider an empty cohort completed", () => {
        expect(getOrganizationCohortActivityStatus([], [])).toBe("not_started");
    });
});

describe("indexOrganizationLearnerActivitiesByContentId", () => {
    it("indexes learner activity through persistence adapters and ignores rows without content", () => {
        const indexed = indexOrganizationLearnerActivitiesByContentId(
            [
                { quiz_id: "quiz-1", state: "completed", user_id: "member-a" },
                { quiz_id: "quiz-1", state: "in_progress", user_id: "member-b" },
                { quiz_id: null, state: "completed", user_id: "member-a" },
            ],
            (row) => row.quiz_id,
            (row) => row.state,
            (row) => row.user_id,
        );

        expect(indexed).toEqual(new Map([
            [
                "quiz-1",
                [
                    { status: "completed", userId: "member-a" },
                    { status: "in_progress", userId: "member-b" },
                ],
            ],
        ]));
    });
});
