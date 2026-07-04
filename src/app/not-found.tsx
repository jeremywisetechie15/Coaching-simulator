import { SearchX } from "lucide-react";
import { RouteStatusState } from "@/features/app-shell/components";

export default function NotFound() {
    return (
        <RouteStatusState
            description="La page demandée n'existe pas ou n'est plus disponible."
            icon={SearchX}
            primaryAction={{ href: "/", label: "Retour au tableau de bord" }}
            title="Page introuvable"
        />
    );
}
