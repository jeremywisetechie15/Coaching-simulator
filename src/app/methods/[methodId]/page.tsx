import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getMethodAssociatedQuizOption } from "@/features/evaluations/server";
import { MethodDetailPage } from "@/features/methods/components";
import { getMethodById } from "@/features/methods/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ methodId: string }>;
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

export default async function Page({ params }: PageProps) {
    const { methodId } = await params;
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/methods/${methodId}`);
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

    return <MethodDetailPage associatedQuiz={associatedQuiz} profileValues={toProfileFormValues(profile)} method={method} />;
}
