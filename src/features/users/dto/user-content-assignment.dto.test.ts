import { describe, expect, it } from "vitest";
import {
    userContentAssignmentDto,
    userContentAssignmentParamsDto,
} from "./user-content-assignment.dto";

const validUserId = "11111111-1111-4111-8111-111111111111";
const validContentId = "22222222-2222-4222-8222-222222222222";

describe("user content assignment DTOs", () => {
    it("accepts UUID route and content identifiers", () => {
        expect(userContentAssignmentParamsDto.parse({ userId: validUserId })).toEqual({ userId: validUserId });
        expect(userContentAssignmentDto.parse({ contentId: validContentId })).toEqual({ contentId: validContentId });
    });

    it("rejects malformed identifiers", () => {
        expect(userContentAssignmentParamsDto.safeParse({ userId: "invalid" }).success).toBe(false);
        expect(userContentAssignmentDto.safeParse({ contentId: "invalid" }).success).toBe(false);
    });
});
