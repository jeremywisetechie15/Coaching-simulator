"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Eye, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ContextualBackLink, ContextualLink, useCurrentAppHref } from "@/features/app-shell/components";
import { withSearchParam, withoutSearchParam } from "@/features/app-shell/domain";
import type {
    OrganizationEvaluationRow,
    OrganizationGroupDetail,
    OrganizationRoleplayRow,
    OrganizationUserRow,
} from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_MEMBER_STATUS_LABELS } from "@/features/organizations/domain/organization-member";
import { Box, Button, CardSurface, FieldLabel, FormRoot, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import {
    createFormSubmitError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { uiTokens } from "@/lib/ui/tokens";
import { OrganizationDetailEvaluations } from "./OrganizationDetailEvaluations";
import { OrganizationDetailRoleplays } from "./OrganizationDetailRoleplays";

type GroupDetailTab = "overview" | "members" | "roleplays" | "evaluations";

interface OrganizationGroupDetailContentProps {
    evaluations: OrganizationEvaluationRow[];
    group: OrganizationGroupDetail;
    members: OrganizationUserRow[];
    roleplays: OrganizationRoleplayRow[];
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

interface GroupPayload {
    group?: OrganizationGroupDetail;
}

const tabs: Array<{ label: string; value: GroupDetailTab }> = [
    { label: "Informations de base", value: "overview" },
    { label: "Membres", value: "members" },
    { label: "Roleplays", value: "roleplays" },
    { label: "Évaluations", value: "evaluations" },
];

function isGroupDetailTab(value: string | null): value is GroupDetailTab {
    return tabs.some((tab) => tab.value === value);
}

const memberColumns = ["Utilisateur", "Email", "Rôle", "Statut", "Roleplays", "Quizzes", "Actions"];

function getApiErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
    const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");

    return validationMessage || payload?.error || fallback;
}

function GroupDetailTabs({
    activeTab,
    onTabChange,
}: {
    activeTab: GroupDetailTab;
    onTabChange: (tab: GroupDetailTab) => void;
}) {
    return (
        <Box className="flex overflow-x-auto border-b border-[#E4E7EE] px-6">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.value;

                return (
                    <Button
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={`relative flex h-[58px] shrink-0 items-center px-5 text-[15px] font-bold transition ${
                            isActive ? "text-[#5140F0]" : "text-[#6F7787] hover:text-[#171B2A]"
                        }`}
                    >
                        <Text as="span">{tab.label}</Text>
                        {isActive && (
                            <Box className="absolute bottom-0 left-5 right-5 h-[3px] rounded-full bg-[#5140F0]" />
                        )}
                    </Button>
                );
            })}
        </Box>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Text className="text-[15px] font-extrabold leading-6 text-[#171B2A]">{label}</Text>
            <Text className="mt-2 text-[15px] font-semibold leading-6 text-[#4F5868]">{value || "-"}</Text>
        </Box>
    );
}

function GroupOverview({
    formError,
    formValues,
    group,
    isEditing,
    isSubmitting,
    onSubmit,
    onValueChange,
}: {
    formError: string | null;
    formValues: { description: string; name: string };
    group: OrganizationGroupDetail;
    isEditing: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    onValueChange: (field: "description" | "name", value: string) => void;
}) {
    if (isEditing) {
        return (
            <Box className="px-7 py-7">
                <FormRoot
                    className="grid gap-6 lg:grid-cols-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit();
                    }}
                    noValidate
                >
                    <Box className="space-y-2">
                        <FieldLabel htmlFor="group-name" className={uiTokens.form.label}>
                            Nom du groupe
                        </FieldLabel>
                        <TextInput
                            id="group-name"
                            hasLeadingIcon={false}
                            value={formValues.name}
                            onChange={(event) => onValueChange("name", event.target.value)}
                            className={uiTokens.form.control}
                        />
                    </Box>
                    <InfoBlock label="Organisation" value={group.organizationName} />
                    <InfoBlock label="Date de création" value={group.createdAt ?? ""} />
                    <InfoBlock label="Nombre de membres" value={`${group.memberCount} membre${group.memberCount > 1 ? "s" : ""}`} />
                    <InfoBlock
                        label="Nombre de Roleplays assignés"
                        value={`${group.roleplayCount} roleplay${group.roleplayCount > 1 ? "s" : ""}`}
                    />
                    <Box className="space-y-2 lg:col-span-2">
                        <FieldLabel htmlFor="group-description" className={uiTokens.form.label}>
                            Description
                        </FieldLabel>
                        <TextArea
                            id="group-description"
                            rows={4}
                            value={formValues.description}
                            onChange={(event) => onValueChange("description", event.target.value)}
                            className={uiTokens.form.textArea}
                        />
                    </Box>
                    {formError && (
                        <Box
                            aria-live="polite"
                            className="rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A] lg:col-span-2"
                        >
                            {formError}
                        </Box>
                    )}
                    <Button type="submit" disabled={isSubmitting || !formValues.name.trim()} className="sr-only">
                        Enregistrer
                    </Button>
                </FormRoot>
            </Box>
        );
    }

    return (
        <Box className="grid gap-x-16 gap-y-8 px-7 py-7 lg:grid-cols-2">
            <InfoBlock label="Nom du groupe" value={group.name} />
            <InfoBlock label="Organisation" value={group.organizationName} />
            <InfoBlock label="Date de création" value={group.createdAt ?? ""} />
            <InfoBlock label="Nombre de membres" value={`${group.memberCount} membre${group.memberCount > 1 ? "s" : ""}`} />
            <InfoBlock
                label="Nombre de Roleplays assignés"
                value={`${group.roleplayCount} roleplay${group.roleplayCount > 1 ? "s" : ""}`}
            />
            <Box className="lg:col-span-2">
                <InfoBlock label="Description" value={group.description ?? ""} />
            </Box>
        </Box>
    );
}

function GroupMembersTable({ members }: { members: OrganizationUserRow[] }) {
    return (
        <Box className="px-7 py-7">
            <Text as="h2" className="mb-6 text-[18px] font-extrabold text-[#171B2A]">
                Membres du groupe
            </Text>
            <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[1080px] border-collapse">
                        <Box as="thead">
                            <Box as="tr" className="border-b border-[#E4E7EE] bg-[#FBFCFE]">
                                {memberColumns.map((column) => (
                                    <Box
                                        as="th"
                                        key={column}
                                        className="px-7 py-4 text-left text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#737B8E]"
                                    >
                                        {column}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Box as="tbody">
                            {members.map((member) => (
                                <Box as="tr" key={member.id} className="border-b border-[#E7E9EF] last:border-b-0">
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="flex items-center gap-4">
                                            <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F2F5] text-[#4F5868]">
                                                <Text as="span" className="text-[13px] font-bold">
                                                    {member.initials}
                                                </Text>
                                            </Box>
                                            <Text className="text-[14px] font-extrabold text-[#171B2A]">{member.name}</Text>
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-semibold text-[#4F5868]">{member.email}</Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="inline-flex h-8 items-center rounded-lg border border-[#D5DAE3] px-3 text-[13px] font-semibold text-[#4F5868]">
                                            {member.role}
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="inline-flex h-8 items-center rounded-lg bg-[#DDF8E6] px-3 text-[13px] font-bold text-[#2A8A41]">
                                            {ORGANIZATION_MEMBER_STATUS_LABELS[member.status]}
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-extrabold text-[#171B2A]">
                                            {member.roleplayCount}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-extrabold text-[#171B2A]">
                                            {member.quizCount}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <ContextualLink
                                            href={`/users/${member.id}`}
                                            aria-label={`Voir ${member.name}`}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9AA2B2] transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                        >
                                            <InlineIcon icon={Eye} className="h-5 w-5" />
                                        </ContextualLink>
                                    </Box>
                                </Box>
                            ))}
                            {members.length === 0 && (
                                <Box as="tr">
                                    <Box as="td" colSpan={memberColumns.length} className="px-7 py-12 text-center">
                                        <Text className="text-[14px] font-bold text-[#171B2A]">Aucun membre</Text>
                                        <Text className="mt-2 text-[14px] font-semibold text-[#A0A6B5]">
                                            Aucun utilisateur n&apos;est assigné à ce groupe.
                                        </Text>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </CardSurface>
        </Box>
    );
}

export function OrganizationGroupDetailContent({
    evaluations,
    group,
    members,
    roleplays,
}: OrganizationGroupDetailContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const [activeTab, setActiveTab] = useState<GroupDetailTab>(() => {
        const tab = searchParams.get("tab");
        return isGroupDetailTab(tab) ? tab : "overview";
    });
    const [currentGroup, setCurrentGroup] = useState(group);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formValues, setFormValues] = useState({
        description: group.description ?? "",
        name: group.name,
    });

    const selectTab = (tab: GroupDetailTab) => {
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
        setFormValues({
            description: currentGroup.description ?? "",
            name: currentGroup.name,
        });
        setFormError(null);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setFormValues({
            description: currentGroup.description ?? "",
            name: currentGroup.name,
        });
        setFormError(null);
        setIsEditing(false);
    };

    const updateFormValue = (field: "description" | "name", value: string) => {
        setFormValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
        setFormError(null);
    };

    const saveGroup = async () => {
        if (isSubmitting) {
            return;
        }

        if (!formValues.name.trim()) {
            setFormError(notifyFormSubmitError(new Error("Le nom du groupe est obligatoire."), "Le nom du groupe est obligatoire."));
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const response = await fetch(`/api/organizations/${currentGroup.organizationId}/groups/${currentGroup.id}`, {
                body: JSON.stringify(formValues),
                headers: { "Content-Type": "application/json" },
                method: "PATCH",
            });
            const payload = (await response.json().catch(() => null)) as ApiErrorPayload | GroupPayload | null;

            if (!response.ok) {
                const message = getApiErrorMessage(payload as ApiErrorPayload | null, "Impossible de modifier le groupe.");
                setFormError(notifyFormSubmitError(createFormSubmitError(message, response.status), message));
                return;
            }

            const updatedGroup = (payload as GroupPayload | null)?.group;

            if (!updatedGroup) {
                const message = "Réponse invalide du serveur.";
                setFormError(notifyFormSubmitError(new Error(message), message));
                return;
            }

            setCurrentGroup(updatedGroup);
            setFormValues({
                description: updatedGroup.description ?? "",
                name: updatedGroup.name,
            });
            setIsEditing(false);
            router.refresh();
            notifyFormSubmitSuccess();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible de modifier le groupe."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const archiveGroup = async () => {
        if (!window.confirm(`Supprimer le groupe ${currentGroup.name} ?`)) {
            return;
        }

        const response = await fetch(`/api/organizations/${currentGroup.organizationId}/groups/${currentGroup.id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            router.push(`/organizations/${currentGroup.organizationId}`);
            router.refresh();
            return;
        }

        setFormError("Impossible de supprimer le groupe.");
    };

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <Box className="flex items-center gap-7">
                        <ContextualBackLink
                            fallbackHref={`/organizations/${currentGroup.organizationId}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#171B2A] transition hover:bg-white"
                            aria-label="Retour à l'organisation"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </ContextualBackLink>
                        <Text as="h1" className="text-[26px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                            Détail du groupe
                        </Text>
                    </Box>

                    <Box className="flex flex-wrap items-center gap-4">
                        {isEditing ? (
                            <>
                                <Button
                                    onClick={cancelEditing}
                                    disabled={isSubmitting}
                                    className="flex h-10 items-center gap-3 rounded-lg border border-[#DADDE4] bg-white px-5 text-[14px] font-bold text-[#171B2A] transition hover:bg-[#F7F8FB] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <InlineIcon icon={X} className="h-5 w-5" />
                                    Annuler
                                </Button>
                                <Button
                                    onClick={saveGroup}
                                    disabled={isSubmitting || !formValues.name.trim()}
                                    className="flex h-10 items-center gap-3 rounded-lg bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.20)] transition hover:bg-[#4635E7] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <InlineIcon icon={Check} className="h-5 w-5" />
                                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={startEditing}
                                className="flex h-10 items-center gap-3 rounded-lg bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.20)] transition hover:bg-[#4635E7]"
                            >
                                <InlineIcon icon={Pencil} className="h-5 w-5" />
                                Modifier
                            </Button>
                        )}
                        <Button
                            disabled={isEditing}
                            onClick={() => void archiveGroup()}
                            className="flex h-10 items-center gap-3 rounded-lg bg-[#DC2027] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(220,32,39,0.18)] transition hover:bg-[#C91C22] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <InlineIcon icon={Trash2} className="h-5 w-5" />
                            Supprimer
                        </Button>
                    </Box>
                </Box>

                <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                    <GroupDetailTabs activeTab={activeTab} onTabChange={selectTab} />
                    {activeTab === "overview" && (
                        <GroupOverview
                            formError={formError}
                            formValues={formValues}
                            group={currentGroup}
                            isEditing={isEditing}
                            isSubmitting={isSubmitting}
                            onSubmit={saveGroup}
                            onValueChange={updateFormValue}
                        />
                    )}
                    {activeTab === "members" && <GroupMembersTable members={members} />}
                    {activeTab === "roleplays" && (
                        <OrganizationDetailRoleplays
                            roleplays={roleplays}
                            title={`Roleplays assignés à ${currentGroup.name}`}
                        />
                    )}
                    {activeTab === "evaluations" && (
                        <OrganizationDetailEvaluations
                            evaluations={evaluations}
                            title={`Évaluations assignées à ${currentGroup.name}`}
                        />
                    )}
                </CardSurface>
            </Box>
        </Box>
    );
}
