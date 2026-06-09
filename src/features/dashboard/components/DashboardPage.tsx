import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { DashboardPageContent } from "./DashboardPageContent";

interface DashboardPageProps {
    profileValues: ProfileFormValues;
}

export function DashboardPage({ profileValues }: DashboardPageProps) {
    return (
        <AppShell
            activePrimaryItem="Tableau de bord"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <DashboardPageContent firstName={profileValues.firstName} />
        </AppShell>
    );
}
