import { describe, expect, it } from "vitest";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import {
    extractAssignmentScore,
    getUserVisibleAssignmentScopes,
    normalizeAssignmentScore,
} from "./user-assignment-visibility";

describe("user assignment visibility", () => {
    it("always includes public and direct user content", () => {
        expect(
            getUserVisibleAssignmentScopes("user-1", {
                groupIds: [],
                organizationIds: [],
            }),
        ).toEqual([
            { scope: CONTENT_VISIBILITY_SCOPE.public },
            { assignedUserId: "user-1", scope: CONTENT_VISIBILITY_SCOPE.user },
        ]);
    });

    it("adds group and organization scopes from the user memberships", () => {
        expect(
            getUserVisibleAssignmentScopes("user-1", {
                groupIds: ["group-1", "group-2"],
                organizationIds: ["org-1"],
            }),
        ).toEqual([
            { scope: CONTENT_VISIBILITY_SCOPE.public },
            { assignedUserId: "user-1", scope: CONTENT_VISIBILITY_SCOPE.user },
            { groupIds: ["group-1", "group-2"], scope: CONTENT_VISIBILITY_SCOPE.group },
            { organizationIds: ["org-1"], scope: CONTENT_VISIBILITY_SCOPE.organization },
        ]);
    });

    it("normalizes numeric and percent string scores", () => {
        expect(normalizeAssignmentScore(38.4)).toBe(38);
        expect(normalizeAssignmentScore("72%")).toBe(72);
        expect(normalizeAssignmentScore(120)).toBe(100);
        expect(normalizeAssignmentScore(-4)).toBe(0);
    });

    it("extracts current scorecard notation score shape", () => {
        expect(
            extractAssignmentScore({
                score_global: {
                    valeur: 38,
                },
            }),
        ).toBe(38);
    });
});
