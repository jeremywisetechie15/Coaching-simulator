import { describe, expect, it } from "vitest";
import {
    MAX_ROLEPLAY_SYNTHESIS_ITEMS,
    ROLEPLAY_PROGRESS_PLAN_SECTION_TITLE,
    limitRoleplaySynthesisLists,
} from "./roleplay-notation";

describe("roleplay notation synthesis rules", () => {
    it("limits every synthesis feedback list without mutating unrelated fields", () => {
        const synthesis = {
            axes_amelioration: ["A1", "A2", "A3", "A4"],
            moments_cles: ["M1", "M2", "M3", "M4"],
            plan_de_progres: ["P1", "P2", "P3", "P4"],
            points_positifs: ["F1", "F2", "F3", "F4"],
            priorite_strategique: "Priorité principale",
        };

        const limited = limitRoleplaySynthesisLists(synthesis);

        expect(MAX_ROLEPLAY_SYNTHESIS_ITEMS).toBe(3);
        expect(limited.axes_amelioration).toEqual(["A1", "A2", "A3"]);
        expect(limited.moments_cles).toEqual(["M1", "M2", "M3"]);
        expect(limited.plan_de_progres).toEqual(["P1", "P2", "P3"]);
        expect(limited.points_positifs).toEqual(["F1", "F2", "F3"]);
        expect(limited.priorite_strategique).toBe("Priorité principale");
        expect(synthesis.points_positifs).toHaveLength(4);
    });

    it("keeps the shared progress-plan section title", () => {
        expect(ROLEPLAY_PROGRESS_PLAN_SECTION_TITLE).toBe("Plan de progrès et priorité stratégique");
    });
});
