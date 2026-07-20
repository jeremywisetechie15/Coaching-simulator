import { describe, expect, it } from "vitest";
import { buildAdminDashboardLinePoints } from "./AdminDashboardActivityChart";

describe("AdminDashboardActivityChart", () => {
    it("builds one connected point for every activity bucket", () => {
        expect(buildAdminDashboardLinePoints([2, 4, 3], 5).split(" ")).toHaveLength(3);
    });
});
