import { notFound, redirect } from "next/navigation";
import { EvaluationQuizPage } from "@/features/evaluations/components";
import { evaluations } from "@/features/evaluations/data/evaluations";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ evaluationId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { evaluationId } = await params;
    const evaluation = evaluations.find((item) => item.id === evaluationId);

    return {
        title: evaluation
            ? `Quiz — ${evaluation.title} | MaiaCoach`
            : "Quiz | Évaluations | MaiaCoach",
    };
}

export default async function Page({ params }: PageProps) {
    const { evaluationId } = await params;
    const evaluation = evaluations.find((item) => item.id === evaluationId);

    if (!evaluation) {
        notFound();
    }

    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/evaluations/${evaluationId}/quiz`);
    }

    return (
        <EvaluationQuizPage profileValues={toProfileFormValues(profile)} evaluation={evaluation} />
    );
}
