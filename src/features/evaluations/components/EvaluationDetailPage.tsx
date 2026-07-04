import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { QuizDetail } from "@/features/evaluations/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillOption } from "@/features/skills/domain/skills";
import { EvaluationDetailPageContent } from "./EvaluationDetailPageContent";

interface EvaluationDetailPageProps {
    quiz: QuizDetail;
    profileValues: ProfileFormValues;
    skillOptions: SkillOption[];
}

export function EvaluationDetailPage({ profileValues, quiz, skillOptions }: EvaluationDetailPageProps) {
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
            <EvaluationDetailPageContent canManage={canManageEvaluations} quiz={quiz} skillOptions={skillOptions} />
        </AppShell>
    );
}
