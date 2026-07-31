import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_NOTE_TYPE,
    type RoleplayCoachNoteGroup,
} from "@/features/roleplays/domain";
import { RoleplayCoachNotesModal } from "./RoleplayCoachNotesModal";

const groups: RoleplayCoachNoteGroup[] = [{
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
    stepOrder: 1,
    stepTitle: "Démarrer l'appel",
}];

describe("RoleplayCoachNotesModal", () => {
    it("renders only persisted note groups and their saved metadata", () => {
        const html = renderToStaticMarkup(
            <RoleplayCoachNotesModal
                groups={groups}
                onClose={vi.fn()}
                roleplayId="2c31c5c6-761e-4a5f-9770-35ddc9edf4c6"
                title="Mes notes de préparation"
            />,
        );

        expect(html).toContain("Mes notes de préparation");
        expect(html).toContain("1 note enregistrée");
        expect(html).toContain("Étape 1 · Démarrer l&#x27;appel");
        expect(html).toContain("Dernière modification le");
        expect(html).toContain("29 juillet 2026");
        expect(html).toContain("Conserver une accroche courte.");
        expect(html).toContain("aria-label=\"Modifier la note\"");
        expect(html).not.toContain("Session enregistrée");
    });

    it("keeps the empty state explicit", () => {
        const html = renderToStaticMarkup(
            <RoleplayCoachNotesModal
                groups={[]}
                onClose={vi.fn()}
                roleplayId="2c31c5c6-761e-4a5f-9770-35ddc9edf4c6"
                title="Mes notes"
            />,
        );

        expect(html).toContain("Aucune note enregistrée pour le moment.");
    });
});
