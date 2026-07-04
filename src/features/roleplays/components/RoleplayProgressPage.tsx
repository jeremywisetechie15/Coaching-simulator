import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { ROLEPLAY_ROUTES, type RoleplayProgress } from "@/features/roleplays/domain";
import { RoleplayProgressPageContent } from "./RoleplayProgressPageContent";

interface RoleplayProgressPageProps {
    profileValues: ProfileFormValues;
    progress: RoleplayProgress;
    roleplay: RoleplayItem;
}

export function RoleplayProgressPage({ profileValues, roleplay, progress }: RoleplayProgressPageProps) {
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
            <RoleplayProgressPageContent backHref={ROLEPLAY_ROUTES.app.detail(roleplay.id)} progress={progress} />
        </AppShell>
    );
}
