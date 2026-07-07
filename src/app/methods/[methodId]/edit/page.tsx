import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { listQuizOptions } from "@/features/evaluations/server";
import { CreateMethodPage } from "@/features/methods/components";
import { getMethodById } from "@/features/methods/server";
import { listOrganizations } from "@/features/organizations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ methodId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { methodId } = await params;

    try {
        const method = await getMethodById(methodId);

        return {
            title: `Modifier ${method.name} | MaiaCoach`,
        };
    } catch {
        return {
            title: "Modifier une méthode | MaiaCoach",
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

        redirect(`/auth?redirect=/methods/${methodId}/edit`);
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.methods)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Méthodes et Playbook"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    let method;

    try {
        method = await getMethodById(methodId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    const [organizations, quizOptions] = await Promise.all([
        listOrganizations(),
        listQuizOptions({ availableForMethodId: methodId }),
    ]);
    const organizationOptions = organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
    }));

    return (
        <CreateMethodPage
            method={method}
            organizationOptions={organizationOptions}
            profileValues={profileValues}
            quizOptions={quizOptions}
        />
    );
}
