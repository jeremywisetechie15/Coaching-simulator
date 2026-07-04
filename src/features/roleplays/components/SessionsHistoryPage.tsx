import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplaySessionHistoryItem } from "@/features/roleplays/server";
import { SessionsHistoryPageContent } from "./SessionsHistoryPageContent";

interface SessionsHistoryPageProps {
    backHref?: string;
    profileValues: ProfileFormValues;
    sessions: RoleplaySessionHistoryItem[];
}

export function SessionsHistoryPage({ backHref, profileValues, sessions }: SessionsHistoryPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <SessionsHistoryPageContent backHref={backHref} sessions={sessions} />
        </AppShell>
    );
}
