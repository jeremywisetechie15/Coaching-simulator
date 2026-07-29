import { notFound, redirect } from "next/navigation";
import { isSelectableContent } from "@/features/content/domain";
import { EvaluationQuizPage } from "@/features/evaluations/components";
import {
    getLatestQuizAttempt,
    getQuizAttempt,
    getQuizById,
} from "@/features/evaluations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkillOptions } from "@/features/skills/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo, withSearchParam } from "@/features/app-shell/domain";
import {
    EVALUATION_ROUTES,
    type QuizAttemptSession,
} from "@/features/evaluations/domain";

interface PageProps {
    params: Promise<{ evaluationId: string }>;
    searchParams?: Promise<{
        attemptId?: string;
        result?: string;
        retry?: string;
        returnTo?: string;
    }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { evaluationId } = await params;

    try {
        const quiz = await getQuizById(evaluationId);

        return {
            title: `Quiz - ${quiz.title} | MaiaCoach`,
        };
    } catch {
        return {
            title: "Quiz | Évaluations | MaiaCoach",
        };
    }
}

export default async function Page({ params, searchParams }: PageProps) {
    const { evaluationId } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const initialView = resolvedSearchParams?.result === "1" ? "results" : "quiz";
    const initialRetryRequested = resolvedSearchParams?.retry === "1";
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        let quizHref = EVALUATION_ROUTES.app.quiz(evaluationId);
        if (resolvedSearchParams?.result === "1") quizHref = withSearchParam(quizHref, "result", "1");
        if (resolvedSearchParams?.retry === "1") quizHref = withSearchParam(quizHref, "retry", "1");
        if (resolvedSearchParams?.attemptId) {
            quizHref = withSearchParam(quizHref, "attemptId", resolvedSearchParams.attemptId);
        }
        redirect(buildAuthRedirectHref(withReturnTo(quizHref, resolvedSearchParams?.returnTo)));
    }

    let quiz;

    try {
        quiz = await getQuizById(evaluationId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    if (!isSelectableContent(quiz.status, quiz.isActive)) {
        redirect(
            withReturnTo(
                EVALUATION_ROUTES.app.detail(evaluationId),
                resolvedSearchParams?.returnTo,
            ),
        );
    }

    const skillOptions = await listSkillOptions();
    let initialAttemptSession: QuizAttemptSession;

    try {
        initialAttemptSession =
            initialView === "results" && resolvedSearchParams?.attemptId
                ? await getQuizAttempt(evaluationId, resolvedSearchParams.attemptId)
                : await getLatestQuizAttempt(evaluationId, {
                    preferCompleted: initialView === "results",
                });
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    return (
        <EvaluationQuizPage
            initialAttemptSession={initialAttemptSession}
            initialRetryRequested={initialRetryRequested}
            initialView={initialView}
            profileValues={toProfileFormValues(profile)}
            quiz={quiz}
            selectedAttemptId={
                initialView === "results"
                    ? resolvedSearchParams?.attemptId
                    : undefined
            }
            skillOptions={skillOptions}
        />
    );
}
