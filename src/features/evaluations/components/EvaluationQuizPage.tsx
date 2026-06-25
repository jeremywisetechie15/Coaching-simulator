import { AppShell } from "@/features/app-shell/components";
import type { QuizDetail } from "@/features/evaluations/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillOption } from "@/features/skills/domain/skills";
import { EvaluationQuizPageContent } from "./EvaluationQuizPageContent";

interface EvaluationQuizPageProps {
    quiz: QuizDetail;
    profileValues: ProfileFormValues;
    skillOptions: SkillOption[];
}

export function EvaluationQuizPage({ profileValues, quiz, skillOptions }: EvaluationQuizPageProps) {
    return (
        <AppShell
            activePrimaryItem="Évaluations"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <EvaluationQuizPageContent quiz={quiz} skillOptions={skillOptions} />
        </AppShell>
    );
}
