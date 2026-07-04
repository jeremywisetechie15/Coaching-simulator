import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { ScorecardListItem } from "@/features/scorecards/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { ScorecardsPageContent } from "./ScorecardsPageContent";

interface ScorecardsPageProps {
    profileValues: ProfileFormValues;
    scorecards: ScorecardListItem[];
}

export function ScorecardsPage({ profileValues, scorecards }: ScorecardsPageProps) {
    const canManageScorecards = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.scorecards);

    return (
        <AppShell
            activePrimaryItem="Scorecards"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <ScorecardsPageContent canManage={canManageScorecards} scorecards={scorecards} />
        </AppShell>
    );
}
