import { redirect } from "next/navigation";
import { PersonasPage } from "@/features/personas/components";
import { listPersonas } from "@/features/personas/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Mes Personas IA | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/personas");
    }

    const personas = await listPersonas();

    return <PersonasPage personas={personas} profileValues={toProfileFormValues(profile)} />;
}
