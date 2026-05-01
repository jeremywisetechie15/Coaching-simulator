import type { OrganizationStatus } from "./organization-list";

export interface CreateOrganizationFormValues {
    contactEmail: string;
    industry: string;
    name: string;
    phone: string;
    region: string;
    status: OrganizationStatus;
}

export type CreateOrganizationFieldErrors = Partial<Record<keyof CreateOrganizationFormValues, string>>;

export const initialCreateOrganizationFormValues: CreateOrganizationFormValues = {
    contactEmail: "",
    industry: "",
    name: "",
    phone: "",
    region: "",
    status: "active",
};

export const organizationRegionOptions = [
    { label: "France", value: "france" },
    { label: "Europe", value: "europe" },
    { label: "Amérique du Nord", value: "north-america" },
    { label: "Afrique", value: "africa" },
    { label: "International", value: "international" },
];
