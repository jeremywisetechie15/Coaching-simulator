import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getMethodAssociatedQuizOption } from "@/features/evaluations/server";
import { MethodDetailPage } from "@/features/methods/components";
import { getMethodById, getMethodMastery } from "@/features/methods/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ methodId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
}

const getCachedMethodById = cache(getMethodById);

export async function generateMetadata({ params }: PageProps) {
    const { methodId } = await params;

    try {
        const method = await getCachedMethodById(methodId);

        return {
            title: `${method.name} | MaiaCoach`,
        };
    } catch {
        return {
            title: "Méthode | MaiaCoach",
        };
    }
}

export default async function Page({ params, searchParams }: PageProps) {
    const { methodId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(buildAuthRedirectHref(withReturnTo(`/methods/${methodId}`, returnTo)));
    }

    let method;

    try {
        method = await getCachedMethodById(methodId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    const associatedQuiz = await getMethodAssociatedQuizOption(methodId);
    const mastery = associatedQuiz ? await getMethodMastery(associatedQuiz.id) : null;

    return (
        <MethodDetailPage
            associatedQuiz={associatedQuiz}
            mastery={mastery}
            profileValues={toProfileFormValues(profile)}
            method={method}
        />
    );
}
