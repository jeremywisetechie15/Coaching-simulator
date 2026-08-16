import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { canEditContent } from "@/features/content/domain";
import { CreateQuizPage } from "@/features/evaluations/components";
import { EVALUATION_ROUTES } from "@/features/evaluations/domain";
import {
    getQuizById,
    getQuizEditorById,
    listQuizMethodOptions,
    listQuizTargetOptions,
} from "@/features/evaluations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkillSelectionOptions } from "@/features/skills/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import {
    APP_NAVIGATION_LABEL,
    buildAuthRedirectHref,
    withReturnTo,
} from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ evaluationId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
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

        redirect(buildAuthRedirectHref(withReturnTo(`/evaluations/${evaluationId}/edit`, returnTo)));
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.evaluations)) {
        return (
            <AccessDeniedPage
                activePrimaryItem={APP_NAVIGATION_LABEL.evaluations}
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    let quiz;

    try {
        quiz = await getQuizEditorById(evaluationId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    if (!canEditContent(quiz.status)) {
        redirect(withReturnTo(EVALUATION_ROUTES.app.detail(evaluationId), returnTo));
    }

    const currentSkillIds = [...new Set(quiz.steps.flatMap((step) => [
        ...step.competenceIds,
        ...step.questions.flatMap((question) => question.competenceId ? [question.competenceId] : []),
    ]))];
    const [methodOptions, targetOptions, skillOptions] = await Promise.all([
        listQuizMethodOptions({ includeUnavailableIds: quiz.methodId ? [quiz.methodId] : [] }),
        listQuizTargetOptions({
            groupId: quiz.groupId,
            organizationId: quiz.organizationId,
            userId: quiz.assignedUserId,
        }),
        listSkillSelectionOptions({ includeUnavailableIds: currentSkillIds }),
    ]);

    return (
        <CreateQuizPage
            groupOptions={targetOptions.groups}
            methodOptions={methodOptions}
            organizationOptions={targetOptions.organizations}
            profileValues={profileValues}
            quiz={quiz}
            skillOptions={skillOptions}
            userOptions={targetOptions.users}
        />
    );
}
