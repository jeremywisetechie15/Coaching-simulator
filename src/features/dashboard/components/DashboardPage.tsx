import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { DashboardViewData } from "@/features/dashboard/domain";
import { DashboardPageContent } from "./DashboardPageContent";

interface DashboardPageProps {
    initialDashboardData?: DashboardViewData;
    profileValues: ProfileFormValues;
}

export function DashboardPage({ initialDashboardData, profileValues }: DashboardPageProps) {
    return (
        <AppShell
            activePrimaryItem="Tableau de bord"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <DashboardPageContent
                firstName={profileValues.firstName}
                initialDashboardData={initialDashboardData}
            />
        </AppShell>
    );
}
