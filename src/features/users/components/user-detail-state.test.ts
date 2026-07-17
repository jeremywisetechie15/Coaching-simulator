import { describe, expect, it } from "vitest";
import { shouldResetUserDraft } from "./user-detail-state";

describe("user detail state", () => {
    it("preserves an unsaved draft when the same user is refreshed during editing", () => {
        expect(shouldResetUserDraft({
            isEditing: true,
            nextUserId: "user-1",
            previousUserId: "user-1",
        })).toBe(false);
    });

    it("resets the draft outside editing or when navigating to another user", () => {
        expect(shouldResetUserDraft({
            isEditing: false,
            nextUserId: "user-1",
            previousUserId: "user-1",
        })).toBe(true);
        expect(shouldResetUserDraft({
            isEditing: true,
            nextUserId: "user-2",
            previousUserId: "user-1",
        })).toBe(true);
    });
});
