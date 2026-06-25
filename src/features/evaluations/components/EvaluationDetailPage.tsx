import { AppShell } from "@/features/app-shell/components";
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
    return (
        <AppShell
            activePrimaryItem="Évaluations"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <EvaluationDetailPageContent quiz={quiz} skillOptions={skillOptions} />
        </AppShell>
    );
}
