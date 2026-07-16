import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArchiveContentConfirmationModal } from "./ArchiveContentConfirmationModal";

describe("ArchiveContentConfirmationModal", () => {
    it("explains that archiving preserves history", () => {
        const html = renderToStaticMarkup(
            <ArchiveContentConfirmationModal
                busy={false}
                entityLabel="le persona"
                name="Sophie Martin"
                onCancel={() => undefined}
                onConfirm={() => undefined}
            />,
        );

        expect(html).toContain("Archiver le persona");
        expect(html).toContain("Les résultats et historiques existants restent conservés");
    });
});
