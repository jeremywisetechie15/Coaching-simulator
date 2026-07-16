import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreatePersonaPage } from "@/features/personas/components";
import type { PersonaCvSummary } from "@/features/personas/domain/persona-cv";
import { getPersonaById, getPersonaCvSummary } from "@/features/personas/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{
        personaId: string;
    }>;
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Modifier un persona IA | MaiaCoach",
};

export default async function Page({ params, searchParams }: PageProps) {
    const { personaId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;
    let persona;
    let personaCv: PersonaCvSummary | null = null;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(buildAuthRedirectHref(withReturnTo(`/personas/${personaId}`, returnTo)));
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
        [persona, personaCv] = await Promise.all([
            getPersonaById(personaId),
            getPersonaCvSummary(personaId),
        ]);
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
            initialCv={personaCv}
            initialValues={persona}
            personaId={personaId}
            profileValues={profileValues}
        />
    );
}
