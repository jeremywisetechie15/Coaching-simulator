import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuizQuestionEditor } from "./QuizQuestionEditor";
import type { QuizQuestionFormState } from "./quiz-form-state";

const question: QuizQuestionFormState = {
    attachments: [
        {
            clientFileId: "",
            deliveryType: "url",
            externalUrl: "https://example.com/support.pdf",
            file: null,
            id: "attachment-1",
            label: "Support",
            storageBucket: "",
            storagePath: "",
            type: "link",
            uploadedFileName: "",
            uploadedFileSizeBytes: null,
        },
    ],
    choices: [
        { id: "choice-1", isCorrect: true, label: "Oui" },
        { id: "choice-2", isCorrect: false, label: "Non" },
    ],
    competenceId: null,
    dimension: "savoir",
    dimensionItem: null,
    dimensionItemId: null,
    explanation: "",
    id: "question-1",
    points: "3",
    prompt: "Quel comportement adopter ?",
    type: "QCM",
};

describe("QuizQuestionEditor", () => {
    it("exposes a collapse control and keeps the requested summary metadata visible", () => {
        const noop = vi.fn();
        const html = renderToStaticMarkup(
            <QuizQuestionEditor
                onAddAttachment={noop}
                onAddChoice={noop}
                onAttachmentDeliveryTypeChange={noop}
                onAttachmentFileSelected={noop}
                onAttachmentPatch={noop}
                onAttachmentUploadClear={noop}
                onChoicePatch={noop}
                onPatch={noop}
                onQuestionTypeChange={noop}
                onRemove={noop}
                onRemoveAttachment={noop}
                onRemoveChoice={noop}
                question={question}
                questionIndex={0}
                removable
                skillOptions={[]}
                stepCompetenceIds={[]}
            />,
        );

        expect(html).toContain('aria-label="Replier la question"');
        expect(html).toContain('aria-expanded="true"');
        expect(html).toContain("QCM (choix multiples)");
        expect(html).toContain("3 points");
        expect(html).toContain("1 pièce jointe");
    });
});
