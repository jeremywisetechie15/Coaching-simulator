"use client";

import { useMemo, useState } from "react";
import { Box } from "@/lib/ui/atoms";
import {
    type CreateOrganizationFieldErrors,
    initialCreateOrganizationFormValues,
    type CreateOrganizationFormValues,
} from "@/features/organizations/domain/create-organization-form";
import {
    type OrganizationListItem,
    type OrganizationStatus,
} from "@/features/organizations/domain/organization-list";
import { CreateOrganizationModal } from "./CreateOrganizationModal";
import { OrganizationsFilterBar } from "./OrganizationsFilterBar";
import { OrganizationsPageHeader } from "./OrganizationsPageHeader";
import { OrganizationsTable } from "./OrganizationsTable";

interface ApiValidationIssue {
    message: string;
    path: Array<string | number>;
}

interface ApiErrorPayload {
    code?: string;
    error?: string;
    issues?: ApiValidationIssue[];
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

interface OrganizationsPageContentProps {
    initialOrganizations: OrganizationListItem[];
}

export function OrganizationsPageContent({ initialOrganizations }: OrganizationsPageContentProps) {
    const [organizations, setOrganizations] = useState<OrganizationListItem[]>(initialOrganizations);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createFieldErrors, setCreateFieldErrors] = useState<CreateOrganizationFieldErrors>({});
    const [createFormError, setCreateFormError] = useState<string | null>(null);
    const [createFormValues, setCreateFormValues] = useState(initialCreateOrganizationFormValues);
    const [searchQuery, setSearchQuery] = useState("");
    const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase("fr-FR");
    const filteredOrganizations = useMemo(() => {
        if (!normalizedSearchQuery) {
            return organizations;
        }

        return organizations.filter((organization) =>
            organization.name.toLocaleLowerCase("fr-FR").includes(normalizedSearchQuery)
        );
    }, [normalizedSearchQuery, organizations]);

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setCreateFormValues(initialCreateOrganizationFormValues);
        setCreateFieldErrors({});
        setCreateFormError(null);
    };

    const updateCreateFormValue = (field: keyof CreateOrganizationFormValues, value: string) => {
        setCreateFormValues((currentValues) => ({
            ...currentValues,
            [field]: field === "status" ? (value as OrganizationStatus) : value,
        }));
        setCreateFieldErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
        }));
        setCreateFormError(null);
    };

    const createOrganization = async () => {
        setIsCreating(true);
        setCreateFieldErrors({});
        setCreateFormError(null);

        try {
            const response = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createFormValues),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const errorPayload = payload as ApiErrorPayload | null;

                if (errorPayload?.code === "VALIDATION_ERROR") {
                    setCreateFieldErrors(mapValidationIssuesToFieldErrors(errorPayload.issues));
                    setCreateFormError(null);
                    return;
                }

                setCreateFormError(errorPayload?.error ?? "Impossible de créer l'organisation.");
                return;
            }

            const organization = payload?.organization as OrganizationListItem | undefined;

            if (!organization) {
                setCreateFormError("Réponse invalide du serveur.");
                return;
            }

            setOrganizations((currentOrganizations) => [organization, ...currentOrganizations]);
            closeCreateModal();
        } catch {
            setCreateFormError("Impossible de créer l'organisation.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <OrganizationsPageHeader onCreateClick={() => setIsCreateModalOpen(true)} />
                <OrganizationsFilterBar searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
                <OrganizationsTable
                    organizations={filteredOrganizations}
                    totalOrganizationCount={organizations.length}
                />
            </Box>

            {isCreateModalOpen && (
                <CreateOrganizationModal
                    fieldErrors={createFieldErrors}
                    formError={createFormError}
                    isSubmitting={isCreating}
                    values={createFormValues}
                    onClose={closeCreateModal}
                    onSubmit={createOrganization}
                    onValueChange={updateCreateFormValue}
                />
            )}
        </Box>
    );
}
