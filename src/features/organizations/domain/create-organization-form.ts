import { ORGANIZATION_STATUS, type OrganizationStatus } from "./organization-list";

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
    status: ORGANIZATION_STATUS.active,
};

export const organizationRegionOptions = [
    { label: "France", value: "france" },
    { label: "Europe", value: "europe" },
    { label: "Amérique du Nord", value: "north-america" },
    { label: "Afrique", value: "africa" },
    { label: "International", value: "international" },
];

export function getOrganizationRegionLabel(region: string) {
    return organizationRegionOptions.find((option) => option.value === region)?.label ?? region;
}
