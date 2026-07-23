import {
    Bot,
    BookOpen,
    Building2,
    CalendarDays,
    ChevronDown,
    Clock3,
    Cpu,
    Download,
    FileCheck2,
    Gamepad2,
    Info,
    MessageCircleMore,
    RefreshCw,
    UsersRound,
} from "lucide-react";
import {
    ADMIN_DASHBOARD_AI_OVERVIEW_ID,
    ADMIN_DASHBOARD_METRIC_ID,
    type AdminDashboardAiOverviewId,
    type AdminDashboardMetricId,
} from "@/features/admin-dashboard/domain";

export const adminDashboardMetricIcons = {
    [ADMIN_DASHBOARD_METRIC_ID.activeOrganizations]: Building2,
    [ADMIN_DASHBOARD_METRIC_ID.activeUsers]: UsersRound,
    [ADMIN_DASHBOARD_METRIC_ID.learningTime]: Clock3,
    [ADMIN_DASHBOARD_METRIC_ID.publishedMethods]: BookOpen,
    [ADMIN_DASHBOARD_METRIC_ID.publishedQuizzes]: FileCheck2,
    [ADMIN_DASHBOARD_METRIC_ID.publishedRoleplays]: Gamepad2,
} satisfies Record<AdminDashboardMetricId, typeof UsersRound>;

export const adminDashboardAiIcons = {
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.askPersona]: MessageCircleMore,
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.coach]: Bot,
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.simulations]: Gamepad2,
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.total]: Clock3,
} satisfies Record<AdminDashboardAiOverviewId, typeof Cpu>;

export const adminDashboardControlIcons = {
    calendar: CalendarDays,
    chevron: ChevronDown,
    download: Download,
    info: Info,
    refresh: RefreshCw,
} as const;
