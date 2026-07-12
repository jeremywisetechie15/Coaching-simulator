import { notFound, redirect } from "next/navigation";
import { EvaluationDetailPage } from "@/features/evaluations/components";
import { getQuizById } from "@/features/evaluations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkillOptions } from "@/features/skills/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ evaluationId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { evaluationId } = await params;

    try {
        const quiz = await getQuizById(evaluationId);

        return {
            title: `${quiz.title} | Évaluations | MaiaCoach`,
        };
    } catch {
        return {
            title: "Évaluation | MaiaCoach",
        };
    }
}

export default async function Page({ params, searchParams }: PageProps) {
    const { evaluationId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(buildAuthRedirectHref(withReturnTo(`/evaluations/${evaluationId}`, returnTo)));
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

    const skillOptions = await listSkillOptions();

    return <EvaluationDetailPage profileValues={toProfileFormValues(profile)} quiz={quiz} skillOptions={skillOptions} />;
}
