import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillDetail } from "@/features/skills/domain/skills";
import { SKILL_USAGE_EDIT_RESTRICTION_MESSAGE } from "@/features/skills/domain/skill-usage-edit-policy";
import type { SaveSkillDto } from "@/features/skills/dto";

const mocks = vi.hoisted(() => ({
    fetchSkillDetail: vi.fn(),
}));

vi.mock("./skill-query", () => ({
    fetchSkillDetail: mocks.fetchSkillDetail,
}));

import {
    assertSkillUsageEditPolicy,
    hasSkillProtectedUsage,
} from "./skill-usage-edit-policy";

const savoirId = "11111111-1111-4111-8111-111111111111";
const savoirFaireId = "22222222-2222-4222-8222-222222222222";
const savoirEtreId = "33333333-3333-4333-8333-333333333333";
const organizationId = "44444444-4444-4444-8444-444444444444";
const groupId = "55555555-5555-4555-8555-555555555555";
const userId = "66666666-6666-4666-8666-666666666666";

function currentSkill(overrides: Partial<SkillDetail> = {}): SkillDetail {
    return {
        assignedUserId: null,
        category: "Prospection",
        description: "Description initiale",
        dimensionItems: [
            {
                dimension: "savoir",
                id: savoirId,
                isActive: true,
                label: "Identifier le décideur",
                order: 1,
                skillId: "acces-decideur",
            },
            {
                dimension: "savoir_faire",
                id: savoirFaireId,
                isActive: true,
                label: "Formuler une demande",
                order: 1,
                skillId: "acces-decideur",
            },
            {
                dimension: "savoir_etre",
                id: savoirEtreId,
                isActive: true,
                label: "Rester assuré",
                order: 1,
                skillId: "acces-decideur",
            },
        ],
        domain: "Commercial",
        groupId: null,
        id: "acces-decideur",
        isActive: true,
        name: "Accès au décideur",
        organizationId: null,
        scope: "public",
        status: "published",
        type: "Métier",
        ...overrides,
    };
}

function unchangedInput(overrides: Partial<SaveSkillDto> = {}): SaveSkillDto {
    return {
        assignedUserId: null,
        category: "Prospection",
        description: "Description initiale",
        dimensionItems: {
            savoir: [{ id: savoirId, label: "Identifier le décideur" }],
            savoir_etre: [{ id: savoirEtreId, label: "Rester assuré" }],
            savoir_faire: [{ id: savoirFaireId, label: "Formuler une demande" }],
        },
        domain: "Commercial",
        groupId: null,
        id: "",
        name: "Accès au décideur",
        organizationId: null,
        scope: "public",
        status: "published",
        type: "Métier",
        ...overrides,
    };
}

function fakeSupabase(hasProtectedUsage: boolean) {
    return {
        rpc: vi.fn().mockResolvedValue({
            data: hasProtectedUsage,
            error: null,
        }),
    };
}

async function expectRejected(
    input: SaveSkillDto,
    skill = currentSkill(),
) {
    mocks.fetchSkillDetail.mockResolvedValueOnce(skill);

    await expect(
        assertSkillUsageEditPolicy(
            fakeSupabase(true) as never,
            skill.id,
            input,
        ),
    ).rejects.toMatchObject({
        message: SKILL_USAGE_EDIT_RESTRICTION_MESSAGE,
        status: 409,
    });
}

describe("skill usage edit policy server guard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("loads the protected usage flag from the server-only RPC", async () => {
        const supabase = fakeSupabase(true);

        await expect(
            hasSkillProtectedUsage(supabase as never, "acces-decideur"),
        ).resolves.toBe(true);
        expect(supabase.rpc).toHaveBeenCalledWith(
            "admin_skill_has_protected_usage",
            { p_skill_id: "acces-decideur" },
        );
    });

    it("allows the name and description to change after protected usage", async () => {
        mocks.fetchSkillDetail.mockResolvedValue(currentSkill());

        await expect(
            assertSkillUsageEditPolicy(
                fakeSupabase(true) as never,
                "acces-decideur",
                unchangedInput({
                    description: "Description clarifiée",
                    name: "Accès aux décideurs",
                }),
            ),
        ).resolves.toBeUndefined();
    });

    it.each([
        ["type", (input: SaveSkillDto) => {
            input.type = "Transversale";
        }],
        ["domain", (input: SaveSkillDto) => {
            input.domain = "Communication";
            input.category = "Gestion des conflits";
        }],
        ["category", (input: SaveSkillDto) => {
            input.category = "Vente";
        }],
        ["dimension rename", (input: SaveSkillDto) => {
            input.dimensionItems.savoir[0]!.label = "Nouveau libellé";
        }],
        ["dimension addition", (input: SaveSkillDto) => {
            input.dimensionItems.savoir.push({ label: "Nouvel item" });
        }],
        ["dimension removal", (input: SaveSkillDto) => {
            input.dimensionItems.savoir = [];
        }],
        ["dimension replacement", (input: SaveSkillDto) => {
            input.dimensionItems.savoir[0]!.id =
                "77777777-7777-4777-8777-777777777777";
        }],
        ["dimension move", (input: SaveSkillDto) => {
            const [item] = input.dimensionItems.savoir.splice(0, 1);
            input.dimensionItems.savoir_faire.push(item!);
        }],
        ["dimension reorder", (input: SaveSkillDto) => {
            input.dimensionItems.savoir.push({
                id: "77777777-7777-4777-8777-777777777777",
                label: "Second item",
            });
            input.dimensionItems.savoir.reverse();
        }],
    ])("rejects a protected %s change", async (_label, mutate) => {
        const input = unchangedInput();
        mutate(input);

        await expectRejected(input);
    });

    it("rejects an organization target change", async () => {
        await expectRejected(
            unchangedInput({
                organizationId:
                    "77777777-7777-4777-8777-777777777777",
                scope: "organization",
            }),
            currentSkill({
                organizationId,
                scope: "organization",
            }),
        );
    });

    it("rejects a group target change", async () => {
        await expectRejected(
            unchangedInput({
                groupId: "77777777-7777-4777-8777-777777777777",
                organizationId,
                scope: "group",
            }),
            currentSkill({
                groupId,
                organizationId,
                scope: "group",
            }),
        );
    });

    it("rejects a user target change", async () => {
        await expectRejected(
            unchangedInput({
                assignedUserId:
                    "77777777-7777-4777-8777-777777777777",
                scope: "user",
            }),
            currentSkill({
                assignedUserId: userId,
                scope: "user",
            }),
        );
    });

    it("allows every change while usage is only draft", async () => {
        const input = unchangedInput();
        input.name = "Nouveau nom";
        input.dimensionItems.savoir = [];

        await expect(
            assertSkillUsageEditPolicy(
                fakeSupabase(false) as never,
                "acces-decideur",
                input,
            ),
        ).resolves.toBeUndefined();
        expect(mocks.fetchSkillDetail).not.toHaveBeenCalled();
    });
});
