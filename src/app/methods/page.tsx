import { redirect } from "next/navigation";
import { MethodsPage } from "@/features/methods/components";
import { listMethods } from "@/features/methods/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo, withSearchParams } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{
        category?: string;
        domain?: string;
        publicationStatus?: string;
        q?: string;
        returnTo?: string;
    }>;
}

export const metadata = {
    title: "Méthodes et Playbooks | MaiaCoach",
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
                    withSearchParams("/methods", {
                        category: filters.category,
                        domain: filters.domain,
                        publicationStatus: filters.publicationStatus,
                        q: filters.q,
                    }),
                    filters.returnTo,
                ),
            ),
        );
    }

    const methods = await listMethods();

    return <MethodsPage methods={methods} profileValues={toProfileFormValues(profile)} />;
}
