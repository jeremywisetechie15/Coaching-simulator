import { redirect } from "next/navigation";
import { CoachesPage } from "@/features/coaches/components";
import { listCoaches } from "@/features/coaches/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Mes Coachs IA | MaiaCoach",
};

export default async function Page({ searchParams }: PageProps) {
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(buildAuthRedirectHref(withReturnTo("/coaches", returnTo)));
    }

    const coaches = await listCoaches();

    return <CoachesPage initialCoaches={coaches} profileValues={toProfileFormValues(profile)} />;
}
