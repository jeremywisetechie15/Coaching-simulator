import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
    buildDashboardLinePoints,
    DashboardPerformanceChart,
} from "./DashboardPerformanceChart";

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

    it("uses the reference trend icon for both score summaries", () => {
        const html = renderToStaticMarkup(createElement(DashboardPerformanceChart, {
            snapshot: {
                chartLabels: ["Semaine 1"],
                scoreSummaries: [
                    { label: "Score moyen roleplay", sampleSize: 2, tone: "roleplay", trend: 4, value: 72 },
                    { label: "Score moyen quiz", sampleSize: 2, tone: "quiz", trend: 2, value: 78 },
                ],
                series: [
                    { label: "Roleplay", tone: "roleplay", values: [72] },
                    { label: "Quiz", tone: "quiz", values: [78] },
                ],
            },
        }));

        expect(html.match(/lucide-trending-up/g)).toHaveLength(2);
        expect(html).not.toContain("lucide-sparkles");
        expect(html).not.toContain("lucide-target");
    });
});
