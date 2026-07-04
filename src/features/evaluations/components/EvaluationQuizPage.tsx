import { AppShell } from "@/features/app-shell/components";
import type { QuizAttemptSession, QuizDetail } from "@/features/evaluations/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillOption } from "@/features/skills/domain/skills";
import { EvaluationQuizPageContent } from "./EvaluationQuizPageContent";

interface EvaluationQuizPageProps {
    initialAttemptSession: QuizAttemptSession;
    initialRetryRequested: boolean;
    initialView: "quiz" | "results";
    quiz: QuizDetail;
    profileValues: ProfileFormValues;
    skillOptions: SkillOption[];
}

export function EvaluationQuizPage({
    initialAttemptSession,
    initialRetryRequested,
    initialView,
    profileValues,
    quiz,
    skillOptions,
}: EvaluationQuizPageProps) {
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
            <EvaluationQuizPageContent
                initialAttemptSession={initialAttemptSession}
                initialRetryRequested={initialRetryRequested}
                initialView={initialView}
                quiz={quiz}
                skillOptions={skillOptions}
            />
        </AppShell>
    );
}
