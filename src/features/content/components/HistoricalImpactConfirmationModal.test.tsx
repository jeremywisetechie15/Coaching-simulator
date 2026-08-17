import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HistoricalImpactConfirmationModal } from "./HistoricalImpactConfirmationModal";

describe("HistoricalImpactConfirmationModal", () => {
    it("explains the historical impact before confirming", () => {
        const html = renderToStaticMarkup(
            <HistoricalImpactConfirmationModal
                busy={false}
                description="Confirmez cette correction."
                message="Les anciennes notes sont conservées."
                onCancel={() => undefined}
                onConfirm={() => undefined}
                title="Corriger le rattachement"
            />,
        );

        expect(html).toContain("Corriger le rattachement");
        expect(html).toContain("Les anciennes notes sont conservées.");
        expect(html).toContain("Confirmer et enregistrer");
    });
});
