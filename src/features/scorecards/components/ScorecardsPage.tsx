import { AppShell } from "@/features/app-shell/components";
import type { ScorecardListItem } from "@/features/scorecards/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { ScorecardsPageContent } from "./ScorecardsPageContent";

interface ScorecardsPageProps {
    profileValues: ProfileFormValues;
    scorecards: ScorecardListItem[];
}

export function ScorecardsPage({ profileValues, scorecards }: ScorecardsPageProps) {
    return (
        <AppShell
            activePrimaryItem="Scorecards"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <ScorecardsPageContent scorecards={scorecards} />
        </AppShell>
    );
}
