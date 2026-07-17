"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box } from "@/lib/ui/atoms";
import { notifyFormSubmitError, notifyFormSubmitSuccess } from "@/lib/ui/feedback/form-submit-feedback";
import {
    type CreateOrganizationFieldErrors,
    initialCreateOrganizationFormValues,
    type CreateOrganizationFormValues,
} from "@/features/organizations/domain/create-organization-form";
import {
    filterOrganizationListItems,
    ORGANIZATION_STATUS_FILTER_ALL,
    type OrganizationListItem,
    type OrganizationStatus,
    type OrganizationStatusFilter,
} from "@/features/organizations/domain/organization-list";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
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

interface OrganizationsPayload {
    organizations?: OrganizationListItem[];
}

interface CreateOrganizationPayload {
    organization?: OrganizationListItem;
}

interface ApiRequestError extends Error {
    payload: ApiErrorPayload | null;
    status: number;
}

function isApiRequestError(error: unknown): error is ApiRequestError {
    return error instanceof Error && "payload" in error && "status" in error;
}

async function readJsonPayload(response: Response) {
    return response.json().catch(() => null) as Promise<unknown>;
}

async function fetchOrganizations() {
    const response = await fetch("/api/organizations", {
        headers: { Accept: "application/json" },
    });
    const payload = (await readJsonPayload(response)) as OrganizationsPayload | ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error((payload as ApiErrorPayload | null)?.error ?? "Impossible de charger les organisations.");
    }

    return (payload as OrganizationsPayload | null)?.organizations ?? [];
}

async function createOrganizationRequest(values: CreateOrganizationFormValues) {
    const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
    });

    const payload = (await readJsonPayload(response)) as CreateOrganizationPayload | ApiErrorPayload | null;

    if (!response.ok) {
        const errorPayload = payload as ApiErrorPayload | null;
        const error = new Error(errorPayload?.error ?? "Impossible de créer l'organisation.") as ApiRequestError;

        error.payload = errorPayload;
        error.status = response.status;

        throw error;
    }

    const organization = (payload as CreateOrganizationPayload | null)?.organization;

    if (!organization) {
        throw new Error("Réponse invalide du serveur.");
    }

    return organization;
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
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFieldErrors, setCreateFieldErrors] = useState<CreateOrganizationFieldErrors>({});
    const [createFormError, setCreateFormError] = useState<string | null>(null);
    const [createFormValues, setCreateFormValues] = useState(initialCreateOrganizationFormValues);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<OrganizationStatusFilter>(
        ORGANIZATION_STATUS_FILTER_ALL,
    );
    const organizationsQuery = useQuery({
        queryKey: ORGANIZATIONS_QUERY_KEY,
        queryFn: fetchOrganizations,
        initialData: initialOrganizations,
    });
    const organizations = organizationsQuery.data;
    const filteredOrganizations = useMemo(
        () => filterOrganizationListItems(organizations, searchQuery, statusFilter),
        [organizations, searchQuery, statusFilter],
    );

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setCreateFormValues(initialCreateOrganizationFormValues);
        setCreateFieldErrors({});
        setCreateFormError(null);
    };

    const createOrganizationMutation = useMutation({
        mutationFn: createOrganizationRequest,
        onError: (error) => {
            if (isApiRequestError(error) && error.payload?.code === "VALIDATION_ERROR") {
                setCreateFieldErrors(mapValidationIssuesToFieldErrors(error.payload.issues));
                setCreateFormError(null);
                notifyFormSubmitError(error, "Vérifiez les champs du formulaire.");
                return;
            }

            setCreateFormError(notifyFormSubmitError(error, "Impossible de créer l'organisation."));
        },
        onSuccess: (organization) => {
            queryClient.setQueryData<OrganizationListItem[]>(ORGANIZATIONS_QUERY_KEY, (currentOrganizations = []) => [
                organization,
                ...currentOrganizations.filter((currentOrganization) => currentOrganization.id !== organization.id),
            ]);
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            notifyFormSubmitSuccess();
            closeCreateModal();
        },
    });

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

    const createOrganization = () => {
        setCreateFieldErrors({});
        setCreateFormError(null);
        createOrganizationMutation.mutate(createFormValues);
    };

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <OrganizationsPageHeader onCreateClick={() => setIsCreateModalOpen(true)} />
                <OrganizationsFilterBar
                    onSearchQueryChange={setSearchQuery}
                    onStatusFilterChange={setStatusFilter}
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                />
                {organizationsQuery.isError && (
                    <Box className="mb-5 rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A]">
                        {organizationsQuery.error.message}
                    </Box>
                )}
                <OrganizationsTable
                    organizations={filteredOrganizations}
                    totalOrganizationCount={organizations.length}
                />
            </Box>

            {isCreateModalOpen && (
                <CreateOrganizationModal
                    fieldErrors={createFieldErrors}
                    formError={createFormError}
                    isSubmitting={createOrganizationMutation.isPending}
                    values={createFormValues}
                    onClose={closeCreateModal}
                    onSubmit={createOrganization}
                    onValueChange={updateCreateFormValue}
                />
            )}
        </Box>
    );
}
