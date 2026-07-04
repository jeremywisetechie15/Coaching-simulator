import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreatePersonaPage } from "@/features/personas/components";
import { getPersonaById } from "@/features/personas/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{
        personaId: string;
    }>;
}

export const metadata = {
    title: "Modifier un persona IA | MaiaCoach",
};

export default async function Page({ params }: PageProps) {
    const { personaId } = await params;
    let profile;
    let persona;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/personas/${personaId}`);
        }

        throw error;
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.personas)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Mes Personas IA"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    try {
        persona = await getPersonaById(personaId);
    } catch (error) {
        if (error instanceof ForbiddenError) {
            return (
                <AccessDeniedPage
                    activePrimaryItem="Mes Personas IA"
                    profileValues={profileValues}
                    searchPlaceholder="Rechercher..."
                />
            );
        }

        throw error;
    }

    if (!persona) {
        notFound();
    }

    return (
        <CreatePersonaPage
            initialValues={persona}
            personaId={personaId}
            profileValues={profileValues}
        />
    );
}
