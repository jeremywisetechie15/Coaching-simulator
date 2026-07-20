import { redirect } from "next/navigation";
import { AdminDashboardPage } from "@/features/admin-dashboard/components";
import { ADMIN_DASHBOARD_ORGANIZATION_ALL } from "@/features/admin-dashboard/domain";
import { getAdminDashboard } from "@/features/admin-dashboard/server";
import { DashboardPage } from "@/features/dashboard/components";
import { getCurrentUserDashboard } from "@/features/dashboard/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { PLATFORM_ROLE } from "@/features/users/domain/users";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Tableau de bord | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/");
    }

    const profileValues = toProfileFormValues(profile);

    if (profileValues.platformRole === PLATFORM_ROLE.admin) {
        let initialAdminDashboardData;

        try {
            initialAdminDashboardData = await getAdminDashboard({
                organization: ADMIN_DASHBOARD_ORGANIZATION_ALL,
                period: 30,
            });
        } catch (error) {
            console.error("Unable to preload admin dashboard data:", error);
        }

        return (
            <AdminDashboardPage
                initialDashboardData={initialAdminDashboardData}
                profileValues={profileValues}
            />
        );
    }

    let initialDashboardData;
    try {
        initialDashboardData = await getCurrentUserDashboard(30);
    } catch (error) {
        console.error("Unable to preload dashboard data:", error);
    }

    return (
        <DashboardPage
            initialDashboardData={initialDashboardData}
            profileValues={profileValues}
        />
    );
}
