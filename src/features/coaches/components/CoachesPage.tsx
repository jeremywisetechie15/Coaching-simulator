import { AppShell } from "@/features/app-shell/components";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CoachesPageContent } from "./CoachesPageContent";

interface CoachesPageProps {
    initialCoaches: CoachListItem[];
    profileValues: ProfileFormValues;
}

export function CoachesPage({ initialCoaches, profileValues }: CoachesPageProps) {
    return (
        <AppShell
            activePrimaryItem="Mes Coachs IA"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CoachesPageContent initialCoaches={initialCoaches} />
        </AppShell>
    );
}
