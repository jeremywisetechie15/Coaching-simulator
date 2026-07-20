import { z } from "zod";
import { ADMIN_DASHBOARD_ORGANIZATION_ALL } from "@/features/admin-dashboard/domain";
import type { AdminDashboardPeriodDays } from "@/features/admin-dashboard/domain";

export const adminDashboardQueryDto = z.object({
    organization: z.union([
        z.literal(ADMIN_DASHBOARD_ORGANIZATION_ALL),
        z.string().uuid("Organisation invalide."),
    ]).default(ADMIN_DASHBOARD_ORGANIZATION_ALL),
    period: z.enum(["7", "30", "90"]).default("30").transform(
        (value) => Number(value) as AdminDashboardPeriodDays,
    ),
});

export type AdminDashboardQueryDto = z.infer<typeof adminDashboardQueryDto>;
