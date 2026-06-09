"use client";

import { useState } from "react";
import { Box, CardSurface } from "@/lib/ui/atoms";
import {
    type CreateOrganizationFieldErrors,
    type CreateOrganizationFormValues,
} from "@/features/organizations/domain/create-organization-form";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";
import type { OrganizationStatus } from "@/features/organizations/domain/organization-list";
import { OrganizationDetailGroups } from "./OrganizationDetailGroups";
import { OrganizationDetailHeader } from "./OrganizationDetailHeader";
import { OrganizationDetailOverview } from "./OrganizationDetailOverview";
import {
    OrganizationDetailTabs,
    type OrganizationDetailTab,
} from "./OrganizationDetailTabs";
import { OrganizationDetailTrainings } from "./OrganizationDetailTrainings";
import { OrganizationDetailUsers } from "./OrganizationDetailUsers";

interface OrganizationDetailContentProps {
    initialIsEditing?: boolean;
    organization: OrganizationDetail;
}

interface ApiValidationIssue {
    message: string;
    path: Array<string | number>;
}

interface ApiErrorPayload {
    code?: string;
    error?: string;
    issues?: ApiValidationIssue[];
}

function getFormValuesFromOrganization(organization: OrganizationDetail): CreateOrganizationFormValues {
    return {
        contactEmail: organization.contactEmail,
        industry: organization.industry,
        name: organization.name,
        phone: organization.phone,
        region: organization.region,
        status: organization.status,
    };
}

function mapValidationIssuesToFieldErrors(issues: ApiValidationIssue[] | undefined) {
    const fieldErrors: CreateOrganizationFieldErrors = {};

    for (const issue of issues ?? []) {
        const field = issue.path[0];

        if (
            field === "contactEmail" ||
            field === "industry" ||
            field === "name" ||
            field === "phone" ||
            field === "region" ||
            field === "status"
        ) {
            fieldErrors[field] = issue.message;
        }
    }

    return fieldErrors;
}

export function OrganizationDetailContent({
    initialIsEditing = false,
    organization,
}: OrganizationDetailContentProps) {
    const [activeTab, setActiveTab] = useState<OrganizationDetailTab>("overview");
    const [currentOrganization, setCurrentOrganization] = useState(organization);
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<CreateOrganizationFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formValues, setFormValues] = useState(() => getFormValuesFromOrganization(organization));

    const startEditing = () => {
        setActiveTab("overview");
        setFormValues(getFormValuesFromOrganization(currentOrganization));
        setFieldErrors({});
        setFormError(null);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setFormValues(getFormValuesFromOrganization(currentOrganization));
        setFieldErrors({});
        setFormError(null);
        setIsEditing(false);
    };

    const updateFormValue = (field: keyof CreateOrganizationFormValues, value: string) => {
        setFormValues((currentValues) => ({
            ...currentValues,
            [field]: field === "status" ? (value as OrganizationStatus) : value,
        }));
        setFieldErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
        }));
        setFormError(null);
    };

    const saveOrganization = async () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setFieldErrors({});
        setFormError(null);

        try {
            const response = await fetch(`/api/organizations/${currentOrganization.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValues),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const errorPayload = payload as ApiErrorPayload | null;

                if (errorPayload?.code === "VALIDATION_ERROR") {
                    setFieldErrors(mapValidationIssuesToFieldErrors(errorPayload.issues));
                    setFormError(null);
                    return;
                }

                setFormError(errorPayload?.error ?? "Impossible de modifier l'organisation.");
                return;
            }

            const updatedOrganization = payload?.organization as OrganizationDetail | undefined;

            if (!updatedOrganization) {
                setFormError("Réponse invalide du serveur.");
                return;
            }

            setCurrentOrganization(updatedOrganization);
            setFormValues(getFormValuesFromOrganization(updatedOrganization));
            setIsEditing(false);
        } catch {
            setFormError("Impossible de modifier l'organisation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <OrganizationDetailHeader
                    isEditing={isEditing}
                    isSubmitting={isSubmitting}
                    name={currentOrganization.name}
                    onCancelEdit={cancelEditing}
                    onEdit={startEditing}
                    onSave={saveOrganization}
                />

                <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                    <OrganizationDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    {activeTab === "overview" && (
                        <OrganizationDetailOverview
                            fieldErrors={fieldErrors}
                            formError={formError}
                            formValues={formValues}
                            isEditing={isEditing}
                            organization={currentOrganization}
                            onSubmit={saveOrganization}
                            onValueChange={updateFormValue}
                        />
                    )}
                    {activeTab === "groups" && <OrganizationDetailGroups organizationId={currentOrganization.id} />}
                    {activeTab === "users" && (
                        <OrganizationDetailUsers
                            organizationId={currentOrganization.id}
                            organizationName={currentOrganization.name}
                        />
                    )}
                    {activeTab === "trainings" && <OrganizationDetailTrainings />}
                </CardSurface>
            </Box>
        </Box>
    );
}
