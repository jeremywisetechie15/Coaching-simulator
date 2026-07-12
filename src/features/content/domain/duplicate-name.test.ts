import { describe, expect, it } from "vitest";
import { getNextDuplicateName } from "./duplicate-name";

describe("getNextDuplicateName", () => {
    it("starts duplicate numbering at two", () => {
        expect(getNextDuplicateName("Méthode DAGO", ["Méthode DAGO"], 180)).toBe("Méthode DAGO (2)");
    });

    it("increments the highest existing duplicate", () => {
        expect(getNextDuplicateName(
            "Méthode DAGO",
            ["Méthode DAGO", "Méthode DAGO (2)", "Méthode DAGO (3)"],
            180,
        )).toBe("Méthode DAGO (4)");
    });

    it("uses the original base when duplicating an existing copy", () => {
        expect(getNextDuplicateName("Méthode DAGO (2)", ["Méthode DAGO (2)"], 180))
            .toBe("Méthode DAGO (3)");
    });

    it("keeps the generated name within the field limit", () => {
        expect(getNextDuplicateName("A".repeat(180), [], 180)).toHaveLength(176);
    });
});
