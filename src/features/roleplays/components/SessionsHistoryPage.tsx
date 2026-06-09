import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { SessionsHistoryPageContent } from "./SessionsHistoryPageContent";

interface SessionsHistoryPageProps {
    profileValues: ProfileFormValues;
}

export function SessionsHistoryPage({ profileValues }: SessionsHistoryPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <SessionsHistoryPageContent />
        </AppShell>
    );
}
