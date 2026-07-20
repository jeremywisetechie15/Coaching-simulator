import { describe, expect, it } from "vitest";
import { buildDashboardLinePoints } from "./DashboardPerformanceChart";

describe("buildDashboardLinePoints", () => {
    it("builds one finite chart point per score", () => {
        const points = buildDashboardLinePoints([0, 50, 100]).split(" ");

        expect(points).toHaveLength(3);
        expect(points.every((point) => /^\d+\.\d{2},\d+\.\d{2}$/.test(point))).toBe(true);
        expect(points.join(" ")).not.toContain("NaN");
    });

    it("keeps a single data point valid", () => {
        expect(buildDashboardLinePoints([68])).toMatch(/^\d+\.\d{2},\d+\.\d{2}$/);
    });

    it("keeps scores connected across periods without data", () => {
        const points = buildDashboardLinePoints([72, null, null, 81]).split(" ");

        expect(points).toHaveLength(2);
        expect(points.every((point) => /^\d+\.\d{2},\d+\.\d{2}$/.test(point))).toBe(true);
    });
});
