import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { SaveSkillDto } from "@/features/skills/dto";
import { replaceSkillDimensionItems } from "./replace-skill-dimension-items";

const savoirItemId = "11111111-1111-4111-8111-111111111111";
const savoirFaireItemId = "22222222-2222-4222-8222-222222222222";

const editedSkillInput: SaveSkillDto = {
    category: "Métier",
    description: "",
    dimensionItems: {
        savoir: [{ id: savoirItemId, label: "Connaissance de la méthode" }],
        savoir_etre: [{ label: "Posture professionnelle" }],
        savoir_faire: [
            { id: savoirFaireItemId, label: "Application en situation" },
            { label: "Traitement des objections" },
        ],
    },
    domain: "Commercial",
    functions: ["Sales"],
    id: "",
    name: "Gestion des objections",
    objective: "Prise de rendez-vous prospect qualifié",
    status: CONTENT_STATUS.published,
};

interface SupabaseCall {
    column?: string;
    options?: unknown;
    payload?: unknown;
    rows?: unknown;
    table: string;
    type: "eq" | "insert" | "update" | "upsert";
    value?: string;
}

function createSupabaseMock(calls: SupabaseCall[]) {
    return {
        from(table: string) {
            return {
                insert(rows: unknown) {
                    calls.push({ rows, table, type: "insert" });
                    return Promise.resolve({ error: null });
                },
                update(payload: unknown) {
                    calls.push({ payload, table, type: "update" });
                    return {
                        eq(column: string, value: string) {
                            calls.push({ column, table, type: "eq", value });
                            return Promise.resolve({ error: null });
                        },
                    };
                },
                upsert(rows: unknown, options: unknown) {
                    calls.push({ options, rows, table, type: "upsert" });
                    return Promise.resolve({ error: null });
                },
            };
        },
    } as unknown as SupabaseClient;
}

describe("replaceSkillDimensionItems", () => {
    it("deactivates previous items then upserts existing edited items and inserts new ones", async () => {
        const calls: SupabaseCall[] = [];
        const supabase = createSupabaseMock(calls);

        await replaceSkillDimensionItems(supabase, "gestion-objections", editedSkillInput);

        expect(calls[0]).toMatchObject({
            payload: {
                is_active: false,
            },
            table: "skill_dimension_items",
            type: "update",
        });
        expect(calls[1]).toMatchObject({
            column: "skill_id",
            table: "skill_dimension_items",
            type: "eq",
            value: "gestion-objections",
        });
        expect(calls[2]).toMatchObject({
            options: { onConflict: "id" },
            rows: [
                {
                    dimension: "savoir",
                    id: savoirItemId,
                    is_active: true,
                    item_order: 1,
                    label: "Connaissance de la méthode",
                    skill_id: "gestion-objections",
                },
                {
                    dimension: "savoir_faire",
                    id: savoirFaireItemId,
                    is_active: true,
                    item_order: 1,
                    label: "Application en situation",
                    skill_id: "gestion-objections",
                },
            ],
            table: "skill_dimension_items",
            type: "upsert",
        });
        expect(calls[3]).toMatchObject({
            rows: [
                {
                    dimension: "savoir_faire",
                    is_active: true,
                    item_order: 2,
                    label: "Traitement des objections",
                    skill_id: "gestion-objections",
                },
                {
                    dimension: "savoir_etre",
                    is_active: true,
                    item_order: 1,
                    label: "Posture professionnelle",
                    skill_id: "gestion-objections",
                },
            ],
            table: "skill_dimension_items",
            type: "insert",
        });
    });
});
