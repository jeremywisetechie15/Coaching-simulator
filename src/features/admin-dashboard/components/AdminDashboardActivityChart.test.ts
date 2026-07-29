import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ADMIN_DASHBOARD_ACTIVITY_SERIES_ID } from "@/features/admin-dashboard/domain";
import {
    AdminDashboardActivityChart,
    buildAdminDashboardLinePoints,
} from "./AdminDashboardActivityChart";

describe("AdminDashboardActivityChart", () => {
    it("builds one connected point for every activity bucket", () => {
        expect(buildAdminDashboardLinePoints([2, 4, 3], 5).split(" ")).toHaveLength(3);
    });

    it("clips the accessible data table without applying sr-only directly to the table", () => {
        const html = renderToStaticMarkup(createElement(AdminDashboardActivityChart, {
            data: {
                labels: ["Jour 1", "Jour 2"],
                series: [{
                    id: ADMIN_DASHBOARD_ACTIVITY_SERIES_ID.connections,
                    label: "Connexions",
                    values: [1, 2],
                }],
            },
        }));

        expect(html).toContain('<div class="sr-only"><table>');
        expect(html).not.toContain('<table class="sr-only">');
    });
});
