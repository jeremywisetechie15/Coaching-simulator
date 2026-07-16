"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Archive,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    CircleAlert,
    Clock,
    FileText,
    Minus,
    MessageSquare,
    Pencil,
    Phone,
    Play,
    Quote,
    Target,
    TrendingDown,
    TrendingUp,
    Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { ContextualBackLink, ContextualLink } from "@/features/app-shell/components";
import {
    ContentResourcesModal,
    type ContentResourceDocument,
    type ContentResourceDocumentKind,
} from "@/features/content/components";
import { EVALUATION_ROUTES, type QuizOption } from "@/features/evaluations/domain";
import {
    formatMethodMasteryDate,
    getMethodMasteryLabel,
    getMethodScopeLabel,
    METHOD_MASTERY_TREND,
    METHOD_ROUTES,
    METHOD_STEP_SECTION,
    METHOD_STEP_SECTION_LABELS,
    type MethodDetail,
    type MethodMastery,
    type MethodResource,
    type MethodStepItem,
} from "@/features/methods/domain/method";
import { ROLEPLAY_ROUTES } from "@/features/roleplays/domain";
import { getStoragePathFileName } from "@/lib/uploads/content-upload";
import { Box, Button, CardSurface, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { AlertMessage } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { getMethodStepIconPresentation } from "./method-step-icon.catalog";

function StepBlock({
    icon,
    italic,
    items,
    title,
    tone,
}: {
    icon: LucideIcon;
    italic?: boolean;
    items: string[];
    title: string;
    tone: keyof typeof uiTokens.stepBlock.tone;
}) {
    if (items.length === 0) {
        return null;
    }

    const palette = uiTokens.stepBlock.tone[tone];

    return (
        <Box className={cn(uiTokens.stepBlock.card, palette.surface)}>
            <Box className={uiTokens.stepBlock.header}>
                <InlineIcon icon={icon} className={cn(uiTokens.stepBlock.icon, palette.accent)} />
                <Text as="p" className={uiTokens.stepBlock.title}>
                    {title}
                </Text>
            </Box>
            <Box className={uiTokens.stepBlock.list}>
                {items.map((item) => (
                    <Box key={item} className={uiTokens.stepBlock.item}>
                        <Box className={cn(uiTokens.stepBlock.dot, palette.dot)} />
                        <Text className={cn(uiTokens.stepBlock.text, italic && "italic")}>{item}</Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

interface MethodQuizActionProps {
    associatedQuiz: QuizOption | null;
    children: ReactNode;
    className: string;
    onMissingQuiz: () => void;
}

function MethodQuizAction({ associatedQuiz, children, className, onMissingQuiz }: MethodQuizActionProps) {
    if (associatedQuiz) {
        return (
            <ContextualLink href={EVALUATION_ROUTES.app.quiz(associatedQuiz.id)} className={className}>
                {children}
            </ContextualLink>
        );
    }

    return (
        <Button onClick={onMissingQuiz} className={className}>
            {children}
        </Button>
    );
}

function getMethodResourceKind(resource: MethodResource): ContentResourceDocumentKind {
    if (resource.resourceType === "audio" || resource.resourceType === "image" || resource.resourceType === "video") {
        return resource.resourceType;
    }

    const fileName = `${resource.storagePath ?? ""} ${resource.externalUrl ?? ""} ${resource.label}`.toLowerCase();
    return fileName.includes(".pdf") ? "pdf" : "document";
}

function getMethodResourceMeta(resource: MethodResource) {
    if (resource.externalUrl) return "URL";
    if (resource.storagePath) return getStoragePathFileName(resource.storagePath);
    return undefined;
}

function getMethodMasteryTrendPresentation(mastery: MethodMastery | null, hasAssociatedQuiz: boolean): {
    icon: LucideIcon;
    label: string;
    tone: keyof typeof uiTokens.tone;
} {
    if (!mastery) {
        return {
            icon: Minus,
            label: hasAssociatedQuiz ? "Aucune évaluation terminée" : "Aucun quiz associé",
            tone: "neutral",
        };
    }

    if (mastery.trend === METHOD_MASTERY_TREND.up) {
        return {
            icon: TrendingUp,
            label: `Progression de ${mastery.delta ?? 0} points depuis le quiz précédent`,
            tone: "success",
        };
    }

    if (mastery.trend === METHOD_MASTERY_TREND.down) {
        return {
            icon: TrendingDown,
            label: `Baisse de ${Math.abs(mastery.delta ?? 0)} points depuis le quiz précédent`,
            tone: "danger",
        };
    }

    if (mastery.trend === METHOD_MASTERY_TREND.stable) {
        return { icon: Minus, label: "Score stable depuis le quiz précédent", tone: "neutral" };
    }

    return { icon: Minus, label: "Première évaluation terminée", tone: "primary" };
}

export function mapMethodResourcesToModalDocuments(method: MethodDetail): ContentResourceDocument[] {
    return method.resources
        .filter((resource) => !resource.stepId)
        .map((resource) => ({
            id: resource.id,
            kind: getMethodResourceKind(resource),
            meta: getMethodResourceMeta(resource),
            title: resource.label || resource.storagePath || resource.externalUrl || "Ressource complémentaire",
            url:
                resource.externalUrl ||
                (resource.storageBucket && resource.storagePath
                    ? METHOD_ROUTES.api.resource(method.id, resource.id)
                    : undefined),
        }));
}

function StepAccordion({
    associatedQuiz,
    onMissingQuiz,
    step,
}: {
    associatedQuiz: QuizOption | null;
    onMissingQuiz: () => void;
    step: MethodStepItem;
}) {
    const [open, setOpen] = useState(false);
    const config = getMethodStepIconPresentation(step.icon);
    const videoResource = step.resources.find((resource) => resource.resourceType === "video");

    return (
        <CardSurface className="overflow-hidden rounded-[14px] border border-[#E5E7EB] shadow-none">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
                <Box
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: config.bg, color: config.color }}
                >
                    <InlineIcon icon={config.icon} className="h-5 w-5" />
                </Box>
                <Text as="h3" className="flex-1 text-[16px] font-bold text-[#111827]">
                    {step.title}
                </Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-5 w-5 shrink-0 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <Box className="border-t border-[#ECEEF3] px-5 py-5">
                    <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{step.summary}</Text>

                    {videoResource && (
                        <Box className="mt-4 flex flex-col gap-3 rounded-[12px] border border-[#FBD9B4] bg-[#FFF7ED] p-4 md:flex-row md:items-center md:justify-between">
                            <Box>
                                <Box className="flex items-center gap-2">
                                    <InlineIcon icon={Video} className="h-4 w-4 text-[#EA580C]" />
                                    <Text as="p" className="text-[14px] font-bold text-[#111827]">
                                        Capsule E-learning
                                    </Text>
                                </Box>
                                <Box className="mt-1 flex items-center gap-1.5">
                                    <InlineIcon icon={Play} className="h-3.5 w-3.5 text-[#EA580C]" />
                                    <Text className="text-[13px] font-medium text-[#6B7280]">
                                        {videoResource.label || videoResource.externalUrl}
                                    </Text>
                                </Box>
                            </Box>
                            <Link
                                href={videoResource.externalUrl}
                                target="_blank"
                                className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#EA580C] px-4 text-[13px] font-bold text-white transition hover:bg-[#DC4F08]"
                            >
                                <InlineIcon icon={Play} className="h-4 w-4" />
                                Voir la vidéo
                            </Link>
                        </Box>
                    )}

                    <Box className="mt-4 space-y-4">
                        <StepBlock
                            tone="violet"
                            icon={Target}
                            title={METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.objectives]}
                            items={step.objectives}
                        />

                        {(step.bestPractices.length > 0 || step.pitfalls.length > 0) && (
                            <Box className="grid gap-4 lg:grid-cols-2">
                                <StepBlock
                                    tone="green"
                                    icon={CheckCircle2}
                                    title={METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.bestPractices]}
                                    items={step.bestPractices}
                                />
                                <StepBlock
                                    tone="orange"
                                    icon={CircleAlert}
                                    title={METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.pitfalls]}
                                    items={step.pitfalls}
                                />
                            </Box>
                        )}

                        {(step.posture.length > 0 || step.verbatims.length > 0) && (
                            <Box className="grid gap-4 lg:grid-cols-2">
                                <StepBlock
                                    tone="blue"
                                    icon={MessageSquare}
                                    title={METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.posture]}
                                    items={step.posture}
                                />
                                <StepBlock
                                    tone="indigo"
                                    icon={Quote}
                                    title={METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.verbatims]}
                                    items={step.verbatims}
                                    italic
                                />
                            </Box>
                        )}
                    </Box>

                    <MethodQuizAction
                        associatedQuiz={associatedQuiz}
                        onMissingQuiz={onMissingQuiz}
                        className="mt-5 flex h-10 items-center justify-center gap-2 rounded-lg border border-[#C9C2FB] bg-white px-4 text-[13px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                    >
                        <InlineIcon icon={FileText} className="h-4 w-4" />
                        Vérifier mes connaissances sur cette étape
                    </MethodQuizAction>
                </Box>
            )}
        </CardSurface>
    );
}

interface ApiErrorPayload {
    error?: string;
}

async function archiveMethodRequest(methodId: string) {
    const response = await fetch(`/api/methods/${methodId}`, {
        method: "DELETE",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'archiver la méthode.");
    }
}

export function MethodDetailPageContent({
    associatedQuiz,
    canManage = false,
    mastery = null,
    method,
}: {
    associatedQuiz: QuizOption | null;
    canManage?: boolean;
    mastery?: MethodMastery | null;
    method: MethodDetail;
}) {
    const router = useRouter();
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [quizNotice, setQuizNotice] = useState<string | null>(null);
    const [confirmArchive, setConfirmArchive] = useState(false);
    const [showResourcesModal, setShowResourcesModal] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const isArchived = method.status === "archived";
    const masteryDateLabel = formatMethodMasteryDate(mastery?.completedAt);
    const masteryTrend = getMethodMasteryTrendPresentation(mastery, Boolean(associatedQuiz));
    const masteryLabel = getMethodMasteryLabel(Boolean(associatedQuiz), mastery);
    const resourceDocuments = mapMethodResourcesToModalDocuments(method);

    async function handleArchive() {
        if (isArchived || isArchiving) return;

        if (!confirmArchive) {
            setArchiveError(null);
            setConfirmArchive(true);
            return;
        }

        setArchiveError(null);
        setIsArchiving(true);

        try {
            await archiveMethodRequest(method.id);
            router.push("/methods");
            router.refresh();
        } catch (error) {
            setArchiveError(error instanceof Error ? error.message : "Impossible d'archiver la méthode.");
            setConfirmArchive(false);
        } finally {
            setIsArchiving(false);
        }
    }

    function showMissingQuizMessage() {
        setQuizNotice("Aucun quiz associé à cette méthode.");
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <ContextualBackLink
                        fallbackHref={METHOD_ROUTES.app.collection}
                        showLabel
                        className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#111827]"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                    </ContextualBackLink>

                    {canManage && (
                        <Box className="flex flex-wrap gap-3">
                            <ContextualLink
                                href={`/methods/${method.id}/edit`}
                                className="flex h-10 items-center justify-center gap-3 rounded-lg bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.20)] transition hover:bg-[#4635E7]"
                            >
                                <InlineIcon icon={Pencil} className="h-5 w-5" />
                                Modifier
                            </ContextualLink>
                            <Button
                                disabled={isArchived || isArchiving}
                                onClick={handleArchive}
                                className={`flex h-10 items-center justify-center gap-3 rounded-lg px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(220,32,39,0.18)] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    confirmArchive
                                        ? "bg-[#B91C1C] hover:bg-[#991B1B]"
                                        : "bg-[#DC2027] hover:bg-[#C91C22]"
                                }`}
                            >
                                <InlineIcon icon={Archive} className="h-5 w-5" />
                                {isArchived
                                    ? "Archivée"
                                    : isArchiving
                                      ? "Archivage..."
                                      : confirmArchive
                                        ? "Confirmer l'archivage"
                                        : "Archiver"}
                            </Button>
                        </Box>
                    )}
                </Box>

                {archiveError && (
                    <Box className="mb-5">
                        <AlertMessage message={archiveError} />
                    </Box>
                )}

                {quizNotice && (
                    <Box className="mb-5">
                        <AlertMessage message={quizNotice} />
                    </Box>
                )}

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    <Box className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <Box className="flex-1">
                            <Text as="h1" className="text-[28px] font-extrabold text-[#111827] md:text-[32px]">
                                {method.name}
                            </Text>
                            <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">
                                {method.description}
                            </Text>
                            <Box className="mt-5 flex flex-wrap gap-3">
                                <Box className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563]">
                                    <InlineIcon icon={Clock} className="h-4 w-4 text-[#9CA3AF]" />
                                    Temps de lecture : {method.readingTimeLabel}
                                </Box>
                                <Box className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563]">
                                    <InlineIcon icon={FileText} className="h-4 w-4 text-[#9CA3AF]" />
                                    {method.stepCount} étape{method.stepCount > 1 ? "s" : ""} pédagogique{method.stepCount > 1 ? "s" : ""}
                                </Box>
                                <Box className="inline-flex h-10 items-center rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563]">
                                    {getMethodScopeLabel(method)}
                                </Box>
                            </Box>
                        </Box>

                        <Box className="flex w-full shrink-0 flex-col gap-3 lg:w-[300px]">
                            <Button
                                onClick={() => setShowResourcesModal(true)}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C9C2FB] bg-white text-[14px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                            >
                                <InlineIcon icon={BookOpen} className="h-4 w-4" />
                                Ressources complémentaires
                            </Button>
                            <CardSurface className="rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-5 shadow-none">
                                <Text className="text-[13px] font-semibold text-[#6B7280]">Maîtrise de la méthode</Text>
                                <Box className="mt-2 flex items-center gap-2.5">
                                    <Tooltip content={masteryTrend.label}>
                                        <Box className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", uiTokens.tone[masteryTrend.tone].soft)}>
                                            <InlineIcon icon={masteryTrend.icon} className="h-4 w-4" />
                                        </Box>
                                    </Tooltip>
                                    <Text
                                        as="h3"
                                        className={cn(
                                            "font-extrabold text-[#111827]",
                                            associatedQuiz ? "text-[20px]" : "text-[15px]",
                                        )}
                                    >
                                        {masteryLabel}
                                    </Text>
                                </Box>
                                {masteryDateLabel && (
                                    <Box className={cn(uiTokens.metadata.dateBadge, "mt-2")}>
                                        <InlineIcon icon={CalendarDays} className={uiTokens.metadata.dateBadgeIcon} />
                                        {masteryDateLabel}
                                    </Box>
                                )}
                                <MethodQuizAction
                                    associatedQuiz={associatedQuiz}
                                    onMissingQuiz={showMissingQuizMessage}
                                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#5140F0] text-[13px] font-bold text-white transition hover:bg-[#4635E7]"
                                >
                                    <InlineIcon icon={FileText} className="h-4 w-4" />
                                    Vérifier mes connaissances
                                </MethodQuizAction>
                            </CardSurface>
                        </Box>
                    </Box>

                    <CardSurface className="mt-6 rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            À retenir en 30 secondes
                        </Text>
                        <Box className="mt-4 flex flex-col gap-3 md:flex-row md:items-stretch">
                            {method.steps.map((step, index) => {
                                const config = getMethodStepIconPresentation(step.icon);
                                return (
                                    <Box key={step.id} className="flex flex-1 items-center gap-3">
                                        <Box className="flex-1 rounded-[12px] border border-[#E5E7EB] bg-white p-4">
                                            <Box
                                                className="flex h-9 w-9 items-center justify-center rounded-lg"
                                                style={{ backgroundColor: config.bg, color: config.color }}
                                            >
                                                <InlineIcon icon={config.icon} className="h-4 w-4" />
                                            </Box>
                                            <Text className="mt-2.5 text-[14px] font-bold text-[#111827]">
                                                {step.shortTitle || step.title}
                                            </Text>
                                            <Text className="mt-0.5 text-[13px] font-medium leading-5 text-[#6B7280]">
                                                {step.takeaway || step.summary || "Étape pédagogique"}
                                            </Text>
                                        </Box>
                                        {index < method.steps.length - 1 && (
                                            <InlineIcon
                                                icon={ArrowRight}
                                                className="hidden h-4 w-4 shrink-0 text-[#C9CED8] md:block"
                                            />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </CardSurface>

                    <Box className="mt-5 grid gap-5 lg:grid-cols-2">
                        <CardSurface className="rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-6 shadow-none">
                            <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                                Objectifs
                            </Text>
                            <Box className="mt-3 space-y-2.5">
                                {method.objectives.map((item) => (
                                    <Box key={item} className="flex gap-2.5">
                                        <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5140F0]" />
                                        <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">
                                            {item}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        </CardSurface>
                        <CardSurface className="rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-6 shadow-none">
                            <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                                Enjeux
                            </Text>
                            <Box className="mt-3 space-y-2.5">
                                {method.challenges.map((item) => (
                                    <Box key={item} className="flex gap-2.5">
                                        <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5140F0]" />
                                        <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">
                                            {item}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        </CardSurface>
                    </Box>

                    <Text as="h2" className="mt-7 text-[18px] font-extrabold text-[#111827]">
                        Les {method.steps.length} étapes de la méthode
                    </Text>
                    <Box className="mt-3 space-y-3">
                        {method.steps.map((step) => (
                            <StepAccordion
                                key={step.title}
                                associatedQuiz={associatedQuiz}
                                onMissingQuiz={showMissingQuizMessage}
                                step={step}
                            />
                        ))}
                    </Box>

                    <CardSurface className="mt-6 flex flex-col gap-4 rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-6 shadow-none md:flex-row md:items-center md:justify-between">
                        <Box>
                            <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                                Prêt à passer à l&apos;action ?
                            </Text>
                            <Text className="mt-1 text-[14px] font-medium text-[#6B7280]">
                                Vérifie ta compréhension, puis entraine-toi avec un roleplay IA.
                            </Text>
                        </Box>
                        <Box className="flex flex-wrap gap-3">
                            <MethodQuizAction
                                associatedQuiz={associatedQuiz}
                                onMissingQuiz={showMissingQuizMessage}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white transition hover:bg-[#4635E7]"
                            >
                                <InlineIcon icon={FileText} className="h-4 w-4" />
                                Vérifier mes connaissances
                            </MethodQuizAction>
                            <ContextualLink
                                href={ROLEPLAY_ROUTES.app.collection}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C9C2FB] bg-white px-5 text-[14px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                            >
                                <InlineIcon icon={Phone} className="h-4 w-4" />
                                Lancer un roleplay
                            </ContextualLink>
                        </Box>
                    </CardSurface>
                </CardSurface>
            </Box>
            {showResourcesModal && (
                <ContentResourcesModal
                    title="Ressources complémentaires"
                    description="Consultez les documents associés à cette méthode."
                    emptyMessage="Aucune ressource complémentaire n'est associée à cette méthode."
                    documents={resourceDocuments}
                    onClose={() => setShowResourcesModal(false)}
                />
            )}
        </Box>
    );
}
