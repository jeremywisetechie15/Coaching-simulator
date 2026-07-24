import { renderToStaticMarkup } from "react-dom/server";
import { Clock3 } from "lucide-react";
import { describe, expect, it } from "vitest";
import { AdminDashboardStatCard } from "./AdminDashboardStatCard";

describe("AdminDashboardStatCard", () => {
    it("renders a real value, its detail and an accessible explanation", () => {
        const html = renderToStaticMarkup(
            <AdminDashboardStatCard
                detail=""
                help="Temps cumulé des activités mesurées."
                icon={Clock3}
                label="Temps total d’apprentissage"
                tone="green"
                value="3h"
                valueLines={["2h roleplay", "1h quiz"]}
            />,
        );

        expect(html).toContain("Temps total d’apprentissage");
        expect(html).toContain("2h roleplay");
        expect(html).toContain("1h quiz");
        expect(html).not.toContain("2h roleplay · 1h quiz");
        expect(html).not.toContain("3h");
        expect(html).toContain("Temps cumulé des activités mesurées.");
        expect(html).toContain("Informations sur Temps total d’apprentissage");
    });
});
