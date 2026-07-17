import { describe, expect, it } from "vitest";
import {
    filterOrganizationListItems,
    ORGANIZATION_STATUS_FILTER_ALL,
    type OrganizationListItem,
} from "./organization-list";

const organizations: OrganizationListItem[] = [
    {
        createdAt: "01/07/2026",
        groupCount: 2,
        id: "organization-active",
        name: "Acme France",
        quizCount: 3,
        roleplayCount: 4,
        status: "active",
        userCount: 12,
    },
    {
        createdAt: "02/07/2026",
        groupCount: 1,
        id: "organization-suspended",
        name: "Acme Belgique",
        quizCount: 1,
        roleplayCount: 2,
        status: "suspended",
        userCount: 6,
    },
    {
        createdAt: "03/07/2026",
        groupCount: 0,
        id: "organization-other",
        name: "Nova Conseil",
        quizCount: 0,
        roleplayCount: 0,
        status: "active",
        userCount: 1,
    },
];

describe("organization list filters", () => {
    it("returns every organization when no filter is active", () => {
        expect(filterOrganizationListItems(organizations, "", ORGANIZATION_STATUS_FILTER_ALL))
            .toEqual(organizations);
    });

    it("filters organizations by status", () => {
        expect(filterOrganizationListItems(organizations, "", "suspended").map(({ id }) => id))
            .toEqual(["organization-suspended"]);
    });

    it("combines the name search and status filter", () => {
        expect(filterOrganizationListItems(organizations, " ACME ", "active").map(({ id }) => id))
            .toEqual(["organization-active"]);
    });
});
