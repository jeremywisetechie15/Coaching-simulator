import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "./content-status";
import {
    getEntitySelectionLabel,
    isSelectableContent,
} from "./entity-selection";

describe("entity selection rules", () => {
    it("only allows published and active content", () => {
        expect(isSelectableContent(CONTENT_STATUS.published, true)).toBe(true);
        expect(isSelectableContent(CONTENT_STATUS.published, false)).toBe(false);
        expect(isSelectableContent(CONTENT_STATUS.draft, true)).toBe(false);
        expect(isSelectableContent(CONTENT_STATUS.archived, true)).toBe(false);
    });

    it("marks a preserved unavailable relation without changing selectable labels", () => {
        expect(getEntitySelectionLabel("Méthode DAGO", {})).toBe("Méthode DAGO");
        expect(getEntitySelectionLabel("Méthode DAGO", { isSelectable: false }))
            .toBe("Méthode DAGO (indisponible)");
    });
});
