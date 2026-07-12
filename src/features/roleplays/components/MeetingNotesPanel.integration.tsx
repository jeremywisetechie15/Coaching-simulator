import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ROLEPLAY_COACH_NOTE_TYPE } from "@/features/roleplays/domain";
import { MeetingNotesPanel } from "./MeetingNotesPanel";

describe("MeetingNotesPanel", () => {
    it("renders the shared note types and saved-note controls", () => {
        const html = renderToStaticMarkup(
            <MeetingNotesPanel
                canSave
                draft=""
                isLoading={false}
                isSaving={false}
                noteType={ROLEPLAY_COACH_NOTE_TYPE.keyPoint}
                notes={[{
                    content: "Conserver une accroche courte.",
                    createdAt: "2026-07-12T09:10:15.000Z",
                    id: "cb27bd22-4207-40aa-92ba-64d01965616f",
                    sourceMessageId: null,
                    type: ROLEPLAY_COACH_NOTE_TYPE.suggestion,
                }]}
                onAdd={vi.fn()}
                onDelete={vi.fn()}
                onDraftChange={vi.fn()}
                onNoteTypeChange={vi.fn()}
                onSave={vi.fn()}
                saveFeedback=""
            />,
        );

        expect(html).toContain("Meeting Notes");
        expect(html).toContain("Point clé");
        expect(html).toContain("Exemple");
        expect(html).toContain("Suggestion");
        expect(html).toContain("Conserver une accroche courte.");
        expect(html).toContain("Sauvegarder les notes (1)");
        expect(html).toContain("Supprimer cette note");
    });
});
