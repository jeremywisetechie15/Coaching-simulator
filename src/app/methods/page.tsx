import { redirect } from "next/navigation";
import { MethodsPage } from "@/features/methods/components";
import { listMethods } from "@/features/methods/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Méthodes et Playbooks | MaiaCoach",
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

        redirect(buildAuthRedirectHref(withReturnTo("/methods", returnTo)));
    }

    const methods = await listMethods();

    return <MethodsPage methods={methods} profileValues={toProfileFormValues(profile)} />;
}
