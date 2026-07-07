import { AccessDeniedState, AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type { QuizOption } from "@/features/evaluations/domain";
import type { MethodDetail, MethodOrganizationOption } from "@/features/methods/domain/method";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreateMethodPageContent } from "./CreateMethodPageContent";

interface CreateMethodPageProps {
    method?: MethodDetail;
    organizationOptions: MethodOrganizationOption[];
    profileValues: ProfileFormValues;
    quizOptions: QuizOption[];
}

export function CreateMethodPage({ method, organizationOptions, profileValues, quizOptions }: CreateMethodPageProps) {
    const canManageMethods = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.methods);

    return (
        <AppShell
            activePrimaryItem="Méthodes et Playbook"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            {canManageMethods ? (
                <CreateMethodPageContent
                    initialMethod={method}
                    organizationOptions={organizationOptions}
                    quizOptions={quizOptions}
                />
            ) : (
                <AccessDeniedState />
            )}
        </AppShell>
    );
}
