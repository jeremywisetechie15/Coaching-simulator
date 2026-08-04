import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EntityJsonPrefillDialog } from "./EntityJsonPrefillDialog";

describe("EntityJsonPrefillDialog", () => {
    it("keeps import and AI-prompt actions in the shared modal", () => {
        const html = renderToStaticMarkup(
            <EntityJsonPrefillDialog
                entityLabel="Compétence"
                onClose={() => undefined}
                onImport={() => undefined}
                prompt="PROMPT DYNAMIQUE"
            />,
        );

        expect(html).toContain("Copier le prompt IA");
        expect(html).toContain("Fichier JSON");
        expect(html).toContain("Préremplir le formulaire");
        expect(html).toContain("les identifiants actuellement autorisés");
    });
});
