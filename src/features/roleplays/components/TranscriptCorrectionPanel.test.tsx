import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";
import {
    TranscriptCorrectionPanel,
    TranscriptCorrectionToggle,
    TranscriptMessageText,
} from "./TranscriptCorrectionPanel";

const correction = {
    criterionRef: "C1",
    original: "parlons de vos priorités",
    reason: "Le cadrage doit annoncer plus clairement l'objectif.",
    suggestion: "Pour bien cadrer notre échange, quelles sont vos priorités ?",
};

describe("transcript correction", () => {
    it("highlights only the exact learner phrase linked by the notation", () => {
        const html = renderToStaticMarkup(
            <p>
                <TranscriptMessageText
                    corrections={[correction]}
                    text="Avant de commencer, parlons de vos priorités."
                />
            </p>,
        );

        expect(html).toContain("<mark");
        expect(html).toContain(">parlons de vos priorités</mark>");
        expect(html).not.toContain("<mark>Avant de commencer");
    });

    it("shows the recommended verbatim and its reason under the message", () => {
        const html = renderToStaticMarkup(
            <TranscriptCorrectionPanel corrections={[correction]} />,
        );

        expect(html).toContain("Correction IA");
        expect(html).toContain("Verbatim préconisé");
        expect(html).toContain(correction.suggestion);
        expect(html).toContain("Pourquoi");
        expect(html).toContain("Le cadrage doit annoncer plus clairement");
    });

    it("shows both retained verbatims for the same learner message", () => {
        const secondCorrection = {
            ...correction,
            criterionRef: "C2",
            reason: "La question gagnerait à être plus directe.",
            suggestion: "Quelles sont vos deux priorités pour cet échange ?",
        };
        const html = renderToStaticMarkup(
            <TranscriptCorrectionPanel corrections={[correction, secondCorrection]} />,
        );

        expect(html).toContain(correction.suggestion);
        expect(html).toContain(secondCorrection.suggestion);
        expect(html.match(/Verbatim préconisé/g)).toHaveLength(2);
    });

    it("renders no correction section when none was validated", () => {
        expect(renderToStaticMarkup(
            <TranscriptCorrectionPanel corrections={[]} />,
        )).toBe("");
    });

    it("renders the active correction toggle with its accessible state", () => {
        const html = renderToStaticMarkup(
            <TranscriptCorrectionToggle enabled onToggle={() => undefined} />,
        );

        expect(html).toContain("Correction IA");
        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain('aria-label="Masquer les corrections IA"');
        expect(html).toContain(
            uiTokens.roleplayEvaluation.transcriptCorrection.toggleActive,
        );
    });

    it("keeps the same label when corrections are hidden", () => {
        const html = renderToStaticMarkup(
            <TranscriptCorrectionToggle enabled={false} onToggle={() => undefined} />,
        );

        expect(html).toContain("Correction IA");
        expect(html).toContain('aria-pressed="false"');
        expect(html).toContain('aria-label="Afficher les corrections IA"');
    });
});
