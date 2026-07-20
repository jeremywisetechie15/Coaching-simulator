import { z } from "zod";
import type { DashboardPeriodDays } from "@/features/dashboard/domain";

export const dashboardQueryDto = z.object({
    period: z.enum(["7", "30", "90"]).default("30").transform(
        (value) => Number(value) as DashboardPeriodDays,
    ),
});
