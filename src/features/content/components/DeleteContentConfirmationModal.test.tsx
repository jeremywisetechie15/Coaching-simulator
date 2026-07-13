import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeleteContentConfirmationModal } from "./DeleteContentConfirmationModal";

describe("DeleteContentConfirmationModal", () => {
    it("explains the published roleplay deletion rule", () => {
        const html = renderToStaticMarkup(
            <DeleteContentConfirmationModal
                busy={false}
                entityLabel="le persona"
                name="Sophie Martin"
                onCancel={() => undefined}
                onConfirm={() => undefined}
            />,
        );

        expect(html).toContain("Supprimer le persona");
        expect(html).toContain("Sophie Martin");
        expect(html).toContain("roleplay publié");
    });

    it("supports a deactivation confirmation without duplicating the modal", () => {
        const html = renderToStaticMarkup(
            <DeleteContentConfirmationModal
                busy={false}
                confirmLabel="Désactiver"
                description="Confirmez la désactivation."
                entityLabel="l'organisation"
                name="MaiaCoach"
                onCancel={() => undefined}
                onConfirm={() => undefined}
                title="Désactiver l'organisation"
                warning="Les données seront conservées."
            />,
        );

        expect(html).toContain("Désactiver l&#x27;organisation");
        expect(html).toContain("Les données seront conservées.");
        expect(html).toContain("Désactiver");
    });
});
