import { redirect } from "next/navigation";
import { EvaluationsPage } from "@/features/evaluations/components";
import { listQuizzes } from "@/features/evaluations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo, withSearchParams } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{
        category?: string;
        domain?: string;
        q?: string;
        returnTo?: string;
        type?: string;
    }>;
}

export const metadata = {
    title: "Évaluations | MaiaCoach",
};

export default async function Page({ searchParams }: PageProps) {
    const filters = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(
            buildAuthRedirectHref(
                withReturnTo(
                    withSearchParams("/evaluations", {
                        category: filters.category,
                        domain: filters.domain,
                        q: filters.q,
                        type: filters.type,
                    }),
                    filters.returnTo,
                ),
            ),
        );
    }

    const quizzes = await listQuizzes();

    return <EvaluationsPage profileValues={toProfileFormValues(profile)} quizzes={quizzes} />;
}
