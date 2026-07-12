import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BriefcaseBusiness } from "lucide-react";
import { EntityProfileDetailsModal } from "./EntityProfileDetailsModal";

describe("EntityProfileDetailsModal", () => {
    it("renders header dates and icon detail fields", () => {
        const html = renderToStaticMarkup(
            <EntityProfileDetailsModal
                createdAt="2026-06-27T10:00:00.000Z"
                updatedAt="2026-06-27T11:00:00.000Z"
                initials="SM"
                name="Sophie Martin"
                onClose={() => undefined}
                sections={[
                    {
                        title: "Identité",
                        fields: [{ icon: BriefcaseBusiness, label: "Fonction", value: "Directrice" }],
                    },
                ]}
            />,
        );

        expect(html).toContain('role="dialog"');
        expect(html).toContain("Créé le");
        expect(html).toContain("Mis à jour le");
        expect(html).toContain("Identité");
        expect(html).toContain("Fonction");
        expect(html).toContain("Directrice");
        expect(html).toContain("<svg");
    });
});
