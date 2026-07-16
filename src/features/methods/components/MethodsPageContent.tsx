"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, BookOpen, Copy, Edit3, MoreHorizontal, Plus } from "lucide-react";
import {
    ContextualBackLink,
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withReturnTo } from "@/features/app-shell/domain";
import { CONTENT_STATUS_LABELS } from "@/features/content/domain";
import { ArchiveContentConfirmationModal } from "@/features/content/components";
import { getMethodScopeLabel, METHOD_ROUTES, type MethodListItem } from "@/features/methods/domain/method";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { CardActionMenu, CardActionMenuButton, CardActionMenuLink } from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface MethodsPageContentProps {
    canManage: boolean;
    methods: MethodListItem[];
}

interface ApiErrorPayload {
    error?: string;
}

async function duplicateMethodRequest(methodId: string) {
    const response = await fetch(METHOD_ROUTES.api.duplicate(methodId), { method: "POST" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de dupliquer la méthode.");
    }
}

async function archiveMethodRequest(methodId: string) {
    const response = await fetch(METHOD_ROUTES.api.detail(methodId), { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'archiver la méthode.");
    }
}

export function MethodsPageContent({ canManage, methods }: MethodsPageContentProps) {
    const router = useRouter();
    const currentHref = useCurrentAppHref();
    const [busyMethodId, setBusyMethodId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [methodToArchive, setMethodToArchive] = useState<MethodListItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    async function handleDuplicate(methodId: string) {
        setError(null);
        setBusyMethodId(methodId);

        try {
            await duplicateMethodRequest(methodId);
            router.refresh();
            setOpenMenuId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de dupliquer la méthode.");
        } finally {
            setBusyMethodId(null);
        }
    }

    async function handleArchive(methodId: string) {
        setError(null);
        setBusyMethodId(methodId);

        try {
            await archiveMethodRequest(methodId);
            router.refresh();
            setOpenMenuId(null);
            setMethodToArchive(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'archiver la méthode.");
        } finally {
            setBusyMethodId(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-9 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <Box className="flex items-start gap-6">
                        <ContextualBackLink
                            fallbackHref="/"
                            aria-label="Retour"
                            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </ContextualBackLink>
                        <Box>
                            <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                                Méthodes et Playbooks
                            </Text>
                            <Text className="mt-2 max-w-[680px] text-[15px] font-semibold leading-6 text-[#596273]">
                                Découvrez les méthodologies éprouvées pour évaluer votre apprentissage et pratique
                            </Text>
                        </Box>
                    </Box>

                    {canManage && (
                        <ContextualLink
                            href="/methods/new"
                            className="mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] md:mt-2"
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Créer une méthode
                        </ContextualLink>
                    )}
                </Box>

                {error && !methodToArchive && (
                    <CardSurface className="mb-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 shadow-none">
                        <Text className={cn("text-[13px] font-semibold", uiTokens.text.danger)}>{error}</Text>
                    </CardSurface>
                )}

                <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {methods.map((method) => (
                        <CardSurface
                            key={method.id}
                            className="relative flex min-h-[180px] flex-col rounded-[14px] border border-[#E5E7EB] shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)]"
                        >
                            {canManage && (
                                <Box className="absolute right-4 top-4 z-10">
                                    <Button
                                        aria-label={`Actions pour ${method.name}`}
                                        onClick={() => setOpenMenuId(openMenuId === method.id ? null : method.id)}
                                        className={cn(uiTokens.action.iconButtonGhost, "opacity-100")}
                                    >
                                        <InlineIcon icon={MoreHorizontal} className="h-4 w-4" />
                                    </Button>
                                    {openMenuId === method.id && (
                                        <CardActionMenu>
                                            <CardActionMenuLink
                                                href={withReturnTo(METHOD_ROUTES.app.edit(method.id), currentHref)}
                                                icon={Edit3}
                                                label={ENTITY_ACTION_LABELS.modify}
                                            />
                                            <CardActionMenuButton
                                                disabled={busyMethodId === method.id}
                                                icon={Copy}
                                                label={ENTITY_ACTION_LABELS.duplicate}
                                                onClick={() => void handleDuplicate(method.id)}
                                            />
                                            <CardActionMenuButton
                                                danger
                                                disabled={busyMethodId === method.id}
                                                icon={Archive}
                                                label={ENTITY_ACTION_LABELS.archive}
                                                onClick={() => {
                                                    setError(null);
                                                    setOpenMenuId(null);
                                                    setMethodToArchive(method);
                                                }}
                                            />
                                        </CardActionMenu>
                                    )}
                                </Box>
                            )}

                            <ContextualLink href={METHOD_ROUTES.app.detail(method.id)} className="flex flex-1 flex-col p-6 pr-12">
                                <Text as="h3" className="text-[19px] font-extrabold leading-7 text-[#111827]">
                                    {method.name}
                                </Text>
                                <Text className="mt-2 line-clamp-2 flex-1 text-[14px] font-medium leading-6 text-[#596273]">
                                    {method.subtitle || method.description || "Méthode pédagogique configurable"}
                                </Text>
                                <Box className="mt-4 flex flex-wrap gap-2">
                                    {(method.domain || method.category) && (
                                        <Box className="inline-flex h-7 w-fit items-center rounded-md border border-[#93C5FD] bg-[#EFF6FF] px-2.5 text-[12px] font-semibold text-[#2563EB]">
                                            {method.domain || method.category}
                                        </Box>
                                    )}
                                    <Box className="inline-flex h-7 w-fit items-center rounded-md border border-[#C7D2FE] bg-[#EEF2FF] px-2.5 text-[12px] font-semibold text-[#4338CA]">
                                        {method.stepCount} étape{method.stepCount > 1 ? "s" : ""}
                                    </Box>
                                    <Box className="inline-flex h-7 w-fit items-center rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 text-[12px] font-semibold text-[#15803D]">
                                        {CONTENT_STATUS_LABELS[method.status]}
                                    </Box>
                                    <Box className="inline-flex h-7 w-fit items-center rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-semibold text-[#4B5563]">
                                        {getMethodScopeLabel(method)}
                                    </Box>
                                </Box>
                            </ContextualLink>
                        </CardSurface>
                    ))}
                </Box>

                {methods.length === 0 && (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={BookOpen} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">Aucune méthode trouvée</Text>
                    </CardSurface>
                )}

                {methodToArchive && (
                    <ArchiveContentConfirmationModal
                        busy={busyMethodId === methodToArchive.id}
                        entityLabel="la méthode"
                        error={error}
                        name={methodToArchive.name}
                        onCancel={() => {
                            setError(null);
                            setMethodToArchive(null);
                        }}
                        onConfirm={() => void handleArchive(methodToArchive.id)}
                    />
                )}
            </Box>
        </Box>
    );
}
