import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_NOTE_TYPE,
    type RoleplayCoachNoteGroup,
} from "@/features/roleplays/domain";
import { RoleplayPreparationModal } from "./RoleplayPreparationModal";

const noteGroups: RoleplayCoachNoteGroup[] = [{
    coachMode: ROLEPLAY_COACH_MODE.beforeTraining,
    methodStepId: "db19834a-0ce2-4426-9903-b96bac9618c6",
    notes: [{
        content: "Conserver une accroche courte.",
        createdAt: "2026-07-29T14:09:00.000Z",
        id: "cb27bd22-4207-40aa-92ba-64d01965616f",
        sourceMessageId: null,
        type: ROLEPLAY_COACH_NOTE_TYPE.keyPoint,
    }],
    savedAt: "2026-07-29T14:09:00.000Z",
    sessionId: null,
    stepOrder: 1,
    stepTitle: "Démarrer l'appel",
}];

describe("RoleplayPreparationModal", () => {
    it("keeps preparation documents and exposes the notes toggle", () => {
        const html = renderToStaticMarkup(
            <RoleplayPreparationModal
                documents={[{
                    id: "resource-1",
                    kind: "pdf",
                    title: "Guide de préparation",
                    url: "https://example.com/guide.pdf",
                }]}
                groups={noteGroups}
                onClose={vi.fn()}
                roleplayId="2c31c5c6-761e-4a5f-9770-35ddc9edf4c6"
            />,
        );

        expect(html).toContain("Documents de préparation");
        expect(html).toContain('aria-label="Contenu de préparation"');
        expect(html).toContain("Documents");
        expect(html).toContain("Notes");
        expect(html).toContain("Guide de préparation");
        expect(html).toContain("1 ressource · 1 note");
    });
});
