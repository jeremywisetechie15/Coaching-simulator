import { notFound, redirect } from "next/navigation";
import { EvaluationPage } from "@/features/roleplays/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { requireAuth } from "@/features/auth/server";
import { getRoleplaySessionEvaluation } from "@/features/roleplays/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export const metadata = {
    title: "Évaluation de la simulation | MaiaCoach",
};

export default async function Page({ params }: PageProps) {
    const { sessionId } = await params;
    let profile;
    let context;

    try {
        context = await requireAuth();
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/roleplays/history/${sessionId}`);
    }

    let view;

    try {
        view = await getRoleplaySessionEvaluation(sessionId, context.userId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    return (
        <EvaluationPage
            evaluation={view.evaluation}
            profileValues={toProfileFormValues(profile)}
            roleplay={view.roleplay}
            session={view.session}
        />
    );
}
