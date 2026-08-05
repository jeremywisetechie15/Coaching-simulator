import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ACTIVITY_SECTORS } from "@/features/profile/domain/activity-sector";
import { ProfileActivitySectorField } from "./ProfileActivitySectorField";

describe("ProfileActivitySectorField", () => {
    it("renders the complete catalog and the nullable option", () => {
        const html = renderToStaticMarkup(
            <ProfileActivitySectorField onChange={vi.fn()} readOnly={false} value="AGR" />,
        );

        expect(html).toContain("Secteur d’activité");
        expect(html).toContain("Non renseigné");
        expect(html).toContain("AGR — Agriculture, sylviculture et pêche");
        expect((html.match(/<option/g) ?? [])).toHaveLength(ACTIVITY_SECTORS.length + 1);
    });

    it("is disabled outside edit mode", () => {
        const html = renderToStaticMarkup(
            <ProfileActivitySectorField onChange={vi.fn()} readOnly value={null} />,
        );

        expect(html).toContain("disabled=\"\"");
        expect(html).toContain("value=\"\" selected=\"\"");
    });
});
