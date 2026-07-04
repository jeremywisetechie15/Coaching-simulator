import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { QuizOption } from "@/features/evaluations/domain";
import type { MethodDetail } from "@/features/methods/domain/method";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { MethodDetailPageContent } from "./MethodDetailPageContent";

interface MethodDetailPageProps {
    associatedQuiz: QuizOption | null;
    profileValues: ProfileFormValues;
    method: MethodDetail;
}

export function MethodDetailPage({ associatedQuiz, profileValues, method }: MethodDetailPageProps) {
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
            <MethodDetailPageContent associatedQuiz={associatedQuiz} canManage={canManageMethods} method={method} />
        </AppShell>
    );
}
