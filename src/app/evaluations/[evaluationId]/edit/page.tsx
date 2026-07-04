import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateQuizPage } from "@/features/evaluations/components";
import {
    getQuizById,
    listQuizGroupOptions,
    listQuizMethodOptions,
    listQuizOrganizationOptions,
    listQuizUserOptions,
} from "@/features/evaluations/server";
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
            title: `Modifier ${quiz.title} | MaiaCoach`,
        };
    } catch {
        return {
            title: "Modifier un quiz | MaiaCoach",
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

        redirect(`/auth?redirect=/evaluations/${evaluationId}/edit`);
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.evaluations)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Évaluations"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
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

    const [methodOptions, organizationOptions, groupOptions, userOptions, skillOptions] = await Promise.all([
        listQuizMethodOptions(),
        listQuizOrganizationOptions(),
        listQuizGroupOptions(),
        listQuizUserOptions(),
        listSkillOptions(),
    ]);

    return (
        <CreateQuizPage
            groupOptions={groupOptions}
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            profileValues={profileValues}
            quiz={quiz}
            skillOptions={skillOptions}
            userOptions={userOptions}
        />
    );
}
