import { AccessDeniedState, AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type { CoachEditorValues } from "@/features/coaches/domain/coach-list";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreateCoachPageContent } from "./CreateCoachPageContent";

interface CreateCoachPageProps {
    coachId?: string;
    initialValues?: CoachEditorValues;
    profileValues: ProfileFormValues;
}

export function CreateCoachPage({ coachId, initialValues, profileValues }: CreateCoachPageProps) {
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
            {canManageCoaches ? (
                <CreateCoachPageContent coachId={coachId} initialValues={initialValues} />
            ) : (
                <AccessDeniedState />
            )}
        </AppShell>
    );
}
