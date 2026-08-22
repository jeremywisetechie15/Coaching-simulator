import { describe, expect, it } from "vitest";
import { APP_NAVIGATION_LABEL } from "@/features/app-shell/domain";
import { primaryNavigation } from "./appNavigation";

describe("primaryNavigation", () => {
    it("places quiz and evaluations before methods and playbook", () => {
        const labels = primaryNavigation.map((item) => item.label);

        expect(labels.indexOf(APP_NAVIGATION_LABEL.evaluations)).toBeLessThan(
            labels.indexOf("Méthodes et Playbook"),
        );
    });

    it("uses the shared scorecard library label", () => {
        expect(primaryNavigation.find((item) => item.href === "/scorecards")?.label).toBe(
            APP_NAVIGATION_LABEL.scorecards,
        );
    });
});
