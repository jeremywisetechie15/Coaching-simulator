import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "./content-status";
import {
    contentAudienceCoversDependency,
    CONTENT_TRANSITION_BLOCK_CODE,
    getContentTransitionBlock,
} from "./publication-rules";
import { CONTENT_VISIBILITY_SCOPE } from "./visibility-scope";

describe("content publication rules", () => {
    it("keeps published content out of draft", () => {
        expect(getContentTransitionBlock(CONTENT_STATUS.published, CONTENT_STATUS.draft)).toEqual({
            code: CONTENT_TRANSITION_BLOCK_CODE.publishedToDraftUnsupported,
        });
        expect(getContentTransitionBlock(CONTENT_STATUS.published, CONTENT_STATUS.archived)).toBeNull();
        expect(getContentTransitionBlock(CONTENT_STATUS.published, CONTENT_STATUS.published)).toBeNull();
    });

    it("allows draft content to be saved, published or archived", () => {
        expect(getContentTransitionBlock(CONTENT_STATUS.draft, CONTENT_STATUS.draft)).toBeNull();
        expect(getContentTransitionBlock(CONTENT_STATUS.draft, CONTENT_STATUS.published)).toBeNull();
        expect(getContentTransitionBlock(CONTENT_STATUS.draft, CONTENT_STATUS.archived)).toBeNull();
    });

    it("keeps archived content terminal", () => {
        expect(getContentTransitionBlock(CONTENT_STATUS.archived, CONTENT_STATUS.draft)).toEqual({
            code: CONTENT_TRANSITION_BLOCK_CODE.archivedRestoreUnsupported,
        });
        expect(getContentTransitionBlock(CONTENT_STATUS.archived, CONTENT_STATUS.published)).toEqual({
            code: CONTENT_TRANSITION_BLOCK_CODE.archivedRestoreUnsupported,
        });
        expect(getContentTransitionBlock(CONTENT_STATUS.archived, CONTENT_STATUS.archived)).toBeNull();
    });

    it("requires a dependency audience to cover every viewer of a published parent", () => {
        expect(contentAudienceCoversDependency(
            { scope: CONTENT_VISIBILITY_SCOPE.public },
            { organizationId: "org-1", scope: CONTENT_VISIBILITY_SCOPE.organization },
        )).toBe(false);
        expect(contentAudienceCoversDependency(
            {
                groupId: "group-1",
                organizationId: "org-1",
                scope: CONTENT_VISIBILITY_SCOPE.group,
            },
            { organizationId: "org-1", scope: CONTENT_VISIBILITY_SCOPE.organization },
        )).toBe(true);
        expect(contentAudienceCoversDependency(
            {
                scope: CONTENT_VISIBILITY_SCOPE.user,
                userId: "user-1",
                userOrganizationIds: ["org-1"],
            },
            { organizationId: "org-1", scope: CONTENT_VISIBILITY_SCOPE.organization },
        )).toBe(true);
        expect(contentAudienceCoversDependency(
            {
                scope: CONTENT_VISIBILITY_SCOPE.user,
                userGroupIds: ["group-1"],
                userId: "user-1",
            },
            { groupId: "group-2", scope: CONTENT_VISIBILITY_SCOPE.group },
        )).toBe(false);
    });
});
