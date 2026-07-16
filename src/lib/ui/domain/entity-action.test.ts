import { describe, expect, it } from "vitest";
import { ENTITY_ACTION_LABELS } from "./entity-action";

describe("ENTITY_ACTION_LABELS", () => {
    it("provides the shared French entity action vocabulary", () => {
        expect(ENTITY_ACTION_LABELS).toEqual({
            archive: "Archiver",
            delete: "Supprimer",
            duplicate: "Dupliquer",
            modify: "Modifier",
            view: "Voir",
        });
    });
});
