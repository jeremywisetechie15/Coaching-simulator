import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { ScorecardDetailView } from "@/features/scorecards/domain";
import { ScorecardDetailPageContent } from "./ScorecardDetailPageContent";

interface ScorecardDetailPageProps {
    profileValues: ProfileFormValues;
    scorecard: ScorecardDetailView;
}

export function ScorecardDetailPage({ profileValues, scorecard }: ScorecardDetailPageProps) {
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
            <ScorecardDetailPageContent canManage={canManageScorecards} scorecard={scorecard} />
        </AppShell>
    );
}
