"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentAppHref } from "@/features/app-shell/components";
import { withSearchParam, withoutSearchParam } from "@/features/app-shell/domain";
import { DeleteContentConfirmationModal } from "@/features/content/components";
import { Box, CardSurface } from "@/lib/ui/atoms";
import {
    createFormSubmitError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { notify } from "@/lib/ui/feedback/toast";
import {
    type CreateOrganizationFieldErrors,
    type CreateOrganizationFormValues,
} from "@/features/organizations/domain/create-organization-form";
import type {
    OrganizationDetail,
    OrganizationEvaluationRow,
    OrganizationRoleplayRow,
} from "@/features/organizations/domain/organization-detail";
import {
    ORGANIZATION_MEMBERS_REMOVAL_MESSAGE,
    ORGANIZATION_REMOVAL_ACTION,
    type OrganizationRemovalAction,
} from "@/features/organizations/domain/organization-deletion";
import { decrementOrganizationUserCount } from "@/features/organizations/domain/organization-user-removal";
import type { OrganizationStatus } from "@/features/organizations/domain/organization-list";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import { OrganizationDetailEvaluations } from "./OrganizationDetailEvaluations";
import { OrganizationDetailGroups } from "./OrganizationDetailGroups";
import { OrganizationDetailHeader } from "./OrganizationDetailHeader";
import { OrganizationDetailOverview } from "./OrganizationDetailOverview";
import { OrganizationDetailRoleplays } from "./OrganizationDetailRoleplays";
import {
    OrganizationDetailTabs,
    ORGANIZATION_DETAIL_TABS,
    type OrganizationDetailTab,
} from "./OrganizationDetailTabs";
import { OrganizationDetailUsers } from "./OrganizationDetailUsers";

interface OrganizationDetailContentProps {
    evaluations?: OrganizationEvaluationRow[];
    initialIsEditing?: boolean;
    organization: OrganizationDetail;
    removalAction: OrganizationRemovalAction;
    roleplays?: OrganizationRoleplayRow[];
}

interface ApiValidationIssue {
    message: string;
    path: Array<string | number>;
}

interface ApiErrorPayload {
    action?: OrganizationRemovalAction;
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

function isOrganizationDetailTab(value: string | null): value is OrganizationDetailTab {
    return ORGANIZATION_DETAIL_TABS.some((tab) => tab.value === value);
}

export function OrganizationDetailContent({
    evaluations = [],
    initialIsEditing = false,
    organization,
    removalAction,
    roleplays = [],
}: OrganizationDetailContentProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const [activeTab, setActiveTab] = useState<OrganizationDetailTab>(() => {
        const tab = searchParams.get("tab");
        return isOrganizationDetailTab(tab) ? tab : "overview";
    });
    const [currentOrganization, setCurrentOrganization] = useState(organization);
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [isRemovalOpen, setIsRemovalOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [removalError, setRemovalError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<CreateOrganizationFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formValues, setFormValues] = useState(() => getFormValuesFromOrganization(organization));

    useEffect(() => {
        setCurrentOrganization(organization);
    }, [organization]);

    useEffect(() => {
        if (initialIsEditing && searchParams.has("edit")) {
            router.replace(withoutSearchParam(currentHref, "edit"), { scroll: false });
        }
    }, [currentHref, initialIsEditing, router, searchParams]);

    const selectTab = (tab: OrganizationDetailTab) => {
        setActiveTab(tab);
        router.replace(
            tab === "overview"
                ? withoutSearchParam(currentHref, "tab")
                : withSearchParam(currentHref, "tab", tab),
            { scroll: false },
        );
    };

    const startEditing = () => {
        selectTab("overview");
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
                    notifyFormSubmitError(
                        createFormSubmitError(errorPayload.error ?? "Vérifiez les champs du formulaire.", response.status),
                        "Vérifiez les champs du formulaire.",
                    );
                    return;
                }

                const message = errorPayload?.error ?? "Impossible de modifier l'organisation.";
                setFormError(notifyFormSubmitError(createFormSubmitError(message, response.status), message));
                return;
            }

            const updatedOrganization = payload?.organization as OrganizationDetail | undefined;

            if (!updatedOrganization) {
                const message = "Réponse invalide du serveur.";
                setFormError(notifyFormSubmitError(new Error(message), message));
                return;
            }

            setCurrentOrganization(updatedOrganization);
            setFormValues(getFormValuesFromOrganization(updatedOrganization));
            setIsEditing(false);
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            router.refresh();
            notifyFormSubmitSuccess();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible de modifier l'organisation."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openRemovalDialog = () => {
        setRemovalError(null);
        setIsRemovalOpen(true);
    };

    const closeRemovalDialog = () => {
        if (isRemoving) return;
        setRemovalError(null);
        setIsRemovalOpen(false);
    };

    const confirmRemoveOrganization = async () => {
        if (isRemoving) return;

        if (removalAction === ORGANIZATION_REMOVAL_ACTION.blocked) {
            setIsRemovalOpen(false);
            selectTab("users");
            return;
        }

        setIsRemoving(true);
        setRemovalError(null);

        try {
            const response = await fetch(`/api/organizations/${currentOrganization.id}`, {
                method: "DELETE",
            });
            const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

            if (!response.ok) {
                setRemovalError(payload?.error ?? "Impossible de retirer l'organisation.");
                return;
            }

            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });

            if (payload?.action === ORGANIZATION_REMOVAL_ACTION.deactivate) {
                setCurrentOrganization((current) => ({
                    ...current,
                    status: "suspended",
                }));
                setIsRemovalOpen(false);
                notify.success("Organisation désactivée");
                router.refresh();
                return;
            }

            notify.success("Organisation supprimée");
            router.push("/organizations");
            router.refresh();
        } catch {
            setRemovalError("Impossible de retirer l'organisation.");
        } finally {
            setIsRemoving(false);
        }
    };

    const isRemovalBlocked = removalAction === ORGANIZATION_REMOVAL_ACTION.blocked;
    const isDeactivation = removalAction === ORGANIZATION_REMOVAL_ACTION.deactivate;
    const removalDialog = isRemovalBlocked
        ? {
            confirmLabel: "Voir les utilisateurs",
            description: `${currentOrganization.name} contient encore des utilisateurs.`,
            title: "Suppression impossible",
            warning: ORGANIZATION_MEMBERS_REMOVAL_MESSAGE,
        }
        : isDeactivation
            ? {
                confirmLabel: "Désactiver",
                description: `Confirmez la désactivation de ${currentOrganization.name}.`,
                title: "Désactiver l'organisation",
                warning: "L'organisation possède des données à conserver. Elle sera désactivée sans supprimer ses membres, ses contenus ni son historique.",
            }
            : {
                confirmLabel: "Supprimer",
                description: `Confirmez la suppression de ${currentOrganization.name}.`,
                title: "Supprimer l'organisation",
                warning: "Cette organisation ne possède aucune donnée à conserver. Sa suppression définitive retirera également ses groupes et ses rattachements.",
            };

    const handleUserRemoved = () => {
        setCurrentOrganization(decrementOrganizationUserCount);
        router.refresh();
    };

    const handleUserInvited = () => {
        router.refresh();
    };

    const handleGroupCreated = () => {
        router.refresh();
    };

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <OrganizationDetailHeader
                    isEditing={isEditing}
                    isSubmitting={isSubmitting}
                    name={currentOrganization.name}
                    organizationStatus={currentOrganization.status}
                    onCancelEdit={cancelEditing}
                    onEdit={startEditing}
                    onRemove={openRemovalDialog}
                    onSave={saveOrganization}
                    removalAction={removalAction}
                />

                <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                    <OrganizationDetailTabs activeTab={activeTab} onTabChange={selectTab} />
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
                    {activeTab === "groups" && (
                        <OrganizationDetailGroups
                            onGroupCreated={handleGroupCreated}
                            organizationId={currentOrganization.id}
                        />
                    )}
                    {activeTab === "users" && (
                        <OrganizationDetailUsers
                            onUserInvited={handleUserInvited}
                            onUserRemoved={handleUserRemoved}
                            organizationId={currentOrganization.id}
                            organizationName={currentOrganization.name}
                        />
                    )}
                    {activeTab === "roleplays" && <OrganizationDetailRoleplays roleplays={roleplays} />}
                    {activeTab === "evaluations" && <OrganizationDetailEvaluations evaluations={evaluations} />}
                </CardSurface>

                {isRemovalOpen && (
                    <DeleteContentConfirmationModal
                        busy={isRemoving}
                        busyLabel={isDeactivation ? "Désactivation..." : "Suppression..."}
                        confirmLabel={removalDialog.confirmLabel}
                        description={removalDialog.description}
                        entityLabel="l'organisation"
                        error={removalError}
                        name={currentOrganization.name}
                        onCancel={closeRemovalDialog}
                        onConfirm={() => void confirmRemoveOrganization()}
                        title={removalDialog.title}
                        warning={removalDialog.warning}
                    />
                )}
            </Box>
        </Box>
    );
}
