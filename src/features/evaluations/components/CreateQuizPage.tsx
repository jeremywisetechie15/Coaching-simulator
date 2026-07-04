import { AccessDeniedState, AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type {
    QuizDetail,
    QuizGroupOption,
    QuizMethodOption,
    QuizOrganizationOption,
    QuizUserOption,
} from "@/features/evaluations/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillOption } from "@/features/skills/domain/skills";
import { CreateQuizPageContent } from "./CreateQuizPageContent";

interface CreateQuizPageProps {
    groupOptions: QuizGroupOption[];
    methodOptions: QuizMethodOption[];
    organizationOptions: QuizOrganizationOption[];
    profileValues: ProfileFormValues;
    quiz?: QuizDetail;
    skillOptions: SkillOption[];
    userOptions: QuizUserOption[];
}

export function CreateQuizPage({
    groupOptions,
    methodOptions,
    organizationOptions,
    profileValues,
    quiz,
    skillOptions,
    userOptions,
}: CreateQuizPageProps) {
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
            {canManageEvaluations ? (
                <CreateQuizPageContent
                    groupOptions={groupOptions}
                    initialQuiz={quiz}
                    methodOptions={methodOptions}
                    organizationOptions={organizationOptions}
                    skillOptions={skillOptions}
                    userOptions={userOptions}
                />
            ) : (
                <AccessDeniedState />
            )}
        </AppShell>
    );
}
