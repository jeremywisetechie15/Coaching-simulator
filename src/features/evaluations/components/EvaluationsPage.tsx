import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { QuizListItem } from "@/features/evaluations/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { EvaluationsPageContent } from "./EvaluationsPageContent";

interface EvaluationsPageProps {
    profileValues: ProfileFormValues;
    quizzes: QuizListItem[];
}

export function EvaluationsPage({ profileValues, quizzes }: EvaluationsPageProps) {
    const canManageEvaluations = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.evaluations);

    return (
        <AppShell
            activePrimaryItem="Évaluations"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <EvaluationsPageContent canManage={canManageEvaluations} quizzes={quizzes} />
        </AppShell>
    );
}
