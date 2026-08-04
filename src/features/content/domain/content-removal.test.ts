import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "./content-status";
import {
    CONTENT_REMOVAL_ACTION,
    getContentRemovalAction,
    getContentRemovalErrorMessage,
} from "./content-removal";

describe("content removal policy", () => {
    it("deletes drafts instead of archiving them", () => {
        expect(getContentRemovalAction(CONTENT_STATUS.draft)).toBe(CONTENT_REMOVAL_ACTION.delete);
        expect(getContentRemovalErrorMessage(CONTENT_STATUS.draft, "la méthode"))
            .toBe("Impossible de supprimer la méthode.");
    });

    it("archives published content to preserve history", () => {
        expect(getContentRemovalAction(CONTENT_STATUS.published)).toBe(CONTENT_REMOVAL_ACTION.archive);
        expect(getContentRemovalErrorMessage(CONTENT_STATUS.published, "la méthode"))
            .toBe("Impossible d’archiver la méthode.");
    });

    it("offers no removal action for archived content", () => {
        expect(getContentRemovalAction(CONTENT_STATUS.archived)).toBeNull();
    });
});
