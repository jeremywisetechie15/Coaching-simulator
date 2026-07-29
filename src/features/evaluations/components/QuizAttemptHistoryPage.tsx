import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_LABEL } from "@/features/app-shell/domain";
import type { QuizAttemptHistoryItem } from "@/features/evaluations/server";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { QuizAttemptHistoryPageContent } from "./QuizAttemptHistoryPageContent";

interface QuizAttemptHistoryPageProps {
    attempts: QuizAttemptHistoryItem[];
    backHref?: string;
    profileValues: ProfileFormValues;
    showQuizFilter?: boolean;
}

export function QuizAttemptHistoryPage({
    attempts,
    backHref,
    profileValues,
    showQuizFilter,
}: QuizAttemptHistoryPageProps) {
    return (
        <AppShell
            activePrimaryItem={APP_NAVIGATION_LABEL.evaluations}
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <QuizAttemptHistoryPageContent
                attempts={attempts}
                backHref={backHref}
                showQuizFilter={showQuizFilter}
            />
        </AppShell>
    );
}
