import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { EvaluationPageContent } from "./EvaluationPageContent";

interface EvaluationPageProps {
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

export function EvaluationPage({ profileValues, roleplay, session }: EvaluationPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <EvaluationPageContent roleplay={roleplay} session={session} />
        </AppShell>
    );
}
