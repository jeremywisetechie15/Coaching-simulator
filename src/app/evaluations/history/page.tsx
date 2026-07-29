import { redirect } from "next/navigation";
import { requireAuth } from "@/features/auth/server";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";
import { QuizAttemptHistoryPage } from "@/features/evaluations/components";
import { EVALUATION_ROUTES } from "@/features/evaluations/domain";
import { listQuizAttemptHistory } from "@/features/evaluations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    searchParams?: Promise<{ quiz_id?: string; returnTo?: string }>;
}

export const metadata = {
    title: "Historique des quizzes | MaiaCoach",
};

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;
    const quizId = params?.quiz_id?.trim() || null;
    const returnTo = params?.returnTo;
    let context;
    let profile;

    try {
        context = await requireAuth();
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(
            buildAuthRedirectHref(
                withReturnTo(
                    quizId
                        ? EVALUATION_ROUTES.app.historyForQuiz(quizId)
                        : EVALUATION_ROUTES.app.history,
                    returnTo,
                ),
            ),
        );
    }

    const attempts = await listQuizAttemptHistory({
        quizId,
        userId: context.userId,
    });

    return (
        <QuizAttemptHistoryPage
            attempts={attempts}
            backHref={
                quizId
                    ? EVALUATION_ROUTES.app.detail(quizId)
                    : EVALUATION_ROUTES.app.collection
            }
            profileValues={toProfileFormValues(profile)}
            showQuizFilter={!quizId}
        />
    );
}
