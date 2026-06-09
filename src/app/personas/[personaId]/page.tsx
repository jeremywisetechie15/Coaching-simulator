import { notFound, redirect } from "next/navigation";
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
        persona = await getPersonaById(personaId);
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/personas/${personaId}`);
        }

        if (error instanceof ForbiddenError) {
            notFound();
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
            profileValues={toProfileFormValues(profile)}
        />
    );
}
