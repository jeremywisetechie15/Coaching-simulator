import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PersonaCvField } from "./PersonaCvField";

const noop = () => undefined;

describe("PersonaCvField", () => {
    it("renders the shared PDF upload constraints when no CV is selected", () => {
        const html = renderToStaticMarkup(
            <PersonaCvField
                file={null}
                onClear={noop}
                onFileSelected={noop}
            />,
        );

        expect(html).toContain('id="persona-cv"');
        expect(html).toContain('accept="application/pdf"');
        expect(html).toContain("Choisir un fichier");
        expect(html).toContain("CV au format PDF : 5 Mo maximum.");
        expect(html).not.toContain("Télécharger le CV actuel");
    });

    it("renders the existing CV and its persona-scoped download route", () => {
        const html = renderToStaticMarkup(
            <PersonaCvField
                file={{ fileName: "CV Sophie.pdf", sizeBytes: 2.5 * 1024 * 1024 }}
                onClear={noop}
                onFileSelected={noop}
                personaId="persona/1"
                showExistingDownload
            />,
        );

        expect(html).toContain("CV Sophie.pdf");
        expect(html).toContain("2.5 Mo");
        expect(html).toContain('href="/api/personas/persona%2F1/cv"');
        expect(html).toContain("Télécharger le CV actuel");
    });
});
