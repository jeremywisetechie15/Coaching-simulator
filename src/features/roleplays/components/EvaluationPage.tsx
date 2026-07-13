import { AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { Evaluation } from "@/features/roleplays/data/evaluation";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { EvaluationPageContent } from "./EvaluationPageContent";

interface EvaluationPageProps {
    evaluation?: Evaluation;
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

export function EvaluationPage({ evaluation, profileValues, roleplay, session }: EvaluationPageProps) {
    const canManage = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.roleplays);

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
            <EvaluationPageContent
                canManage={canManage}
                evaluation={evaluation}
                roleplay={roleplay}
                session={session}
            />
        </AppShell>
    );
}
