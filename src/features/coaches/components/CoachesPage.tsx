import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CoachesPageContent } from "./CoachesPageContent";

interface CoachesPageProps {
    initialCoaches: CoachListItem[];
    profileValues: ProfileFormValues;
}

export function CoachesPage({ initialCoaches, profileValues }: CoachesPageProps) {
    const canManageCoaches = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.coaches);

    return (
        <AppShell
            activePrimaryItem="Mes Coachs IA"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CoachesPageContent canManage={canManageCoaches} initialCoaches={initialCoaches} />
        </AppShell>
    );
}
