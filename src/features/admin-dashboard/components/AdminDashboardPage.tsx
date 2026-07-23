import { AppShell } from "@/features/app-shell/components";
import type { AdminDashboardViewData } from "@/features/admin-dashboard/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { AdminDashboardPageContent } from "./AdminDashboardPageContent";

interface AdminDashboardPageProps {
    initialDashboardData?: AdminDashboardViewData;
    profileValues: ProfileFormValues;
}

export function AdminDashboardPage({ initialDashboardData, profileValues }: AdminDashboardPageProps) {
    return (
        <AppShell
            activePrimaryItem="Tableau de bord"
            avatarUrl={profileValues.avatarUrl}
            email={profileValues.email}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            initials={getProfileInitials(profileValues)}
            platformRole={profileValues.platformRole}
            searchPlaceholder="Rechercher..."
        >
            <AdminDashboardPageContent
                firstName={profileValues.firstName}
                initialDashboardData={initialDashboardData}
            />
        </AppShell>
    );
}
