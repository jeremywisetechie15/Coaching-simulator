import { notFound, redirect } from "next/navigation";
import { EvaluationQuizPage } from "@/features/evaluations/components";
import { getQuizById } from "@/features/evaluations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkillOptions } from "@/features/skills/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ evaluationId: string }>;
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

export default async function Page({ params }: PageProps) {
    const { evaluationId } = await params;
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/evaluations/${evaluationId}/quiz`);
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

    return <EvaluationQuizPage profileValues={toProfileFormValues(profile)} quiz={quiz} skillOptions={skillOptions} />;
}
