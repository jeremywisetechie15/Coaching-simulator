"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, History, Target } from "lucide-react";
import {
    ContextualBackLink,
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withSearchParam, withoutSearchParam } from "@/features/app-shell/domain";
import { DiscProfileBadge } from "@/features/content/components";
import {
    categoryBadgeStyles,
    difficultyBadgeStyles,
} from "@/features/roleplays/data/roleplays";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { ROLEPLAY_ROUTES } from "@/features/roleplays/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { RoleplayDocumentsModal } from "./RoleplayDocumentsModal";
import { RoleplayIndexSummaryCard } from "./RoleplayIndexSummaryCard";
import { roleplayChipIcons } from "./roleplayChipIcons";
import { RoleplayQuizModal } from "./RoleplayQuizModal";

interface RoleplayDetailPageContentProps {
    roleplay: RoleplayItem;
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Box className="rounded-[16px] bg-[#EEF0FB] p-6">
            <Text as="h2" className={uiTokens.roleplayDetail.infoCardTitle}>
                {title}
            </Text>
            <Text className="mt-3 text-[15px] font-medium leading-7 text-[#3F4654]">{children}</Text>
        </Box>
    );
}

function PrepCard({
    title,
    description,
    cta,
    href,
    onClick,
}: {
    title: string;
    description: string;
    cta: string;
    href?: string;
    onClick?: () => void;
}) {
    const ctaClassName =
        "mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-[#5140F0] text-[13px] font-bold text-white transition hover:bg-[#4635E7]";

    return (
        <CardSurface className="flex flex-col rounded-[14px] border border-[#E5E7EB] p-5 shadow-none">
            <Text as="h3" className={uiTokens.roleplayDetail.preparationCardTitle}>
                {title}
            </Text>
            <Text className="mt-2 flex-1 text-[13px] font-medium leading-6 text-[#6B7280]">
                {description}
            </Text>
            {href ? (
                <ContextualLink href={href} className={ctaClassName}>
                    {cta}
                </ContextualLink>
            ) : (
                <Button onClick={onClick} className={ctaClassName}>
                    {cta}
                </Button>
            )}
        </CardSurface>
    );
}

export function RoleplayDetailPageContent({ roleplay }: RoleplayDetailPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const { detail } = roleplay;
    const categoryStyle = categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
    const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
    const [activeModal, setActiveModal] = useState<"quiz" | "documents" | null>(() => {
        const panel = searchParams.get("panel");
        return panel === "quizzes" ? "quiz" : panel === "documents" ? "documents" : null;
    });
    const prepDocuments = roleplay.prepDocuments ?? [];
    const prepQuizzes = roleplay.prepQuizzes ?? [];

    function closeModal() {
        setActiveModal(null);

        if (searchParams.has("panel")) {
            router.replace(withoutSearchParam(currentHref, "panel"), { scroll: false });
        }
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5 flex items-center">
                    <ContextualBackLink
                        fallbackHref={ROLEPLAY_ROUTES.app.collection}
                        showLabel
                        className={uiTokens.action.backButton}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                    </ContextualBackLink>
                </Box>

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    <Box className="flex items-start justify-between gap-4">
                        <Box className="flex flex-wrap items-center gap-2">
                            <Box
                                className="inline-flex h-7 items-center rounded-lg px-3 text-[13px] font-semibold"
                                style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                            >
                                {roleplay.category}
                            </Box>
                            <Box
                                className="inline-flex h-7 items-center rounded-lg border px-3 text-[13px] font-semibold"
                                style={{
                                    backgroundColor: difficultyStyle.bg,
                                    borderColor: difficultyStyle.border,
                                    color: difficultyStyle.text,
                                }}
                            >
                                {roleplay.difficulty}
                            </Box>
                        </Box>
                        <Box className="flex flex-wrap items-center gap-2">
                            <ContextualLink
                                href={ROLEPLAY_ROUTES.app.historyForRoleplay(roleplay.scenarioId ?? roleplay.id)}
                                className={uiTokens.roleplayDetail.quickLink}
                            >
                                <InlineIcon icon={History} className={uiTokens.roleplayDetail.quickLinkIcon} />
                                Historique
                            </ContextualLink>
                            <ContextualLink
                                href={ROLEPLAY_ROUTES.app.progress(roleplay.id)}
                                className={uiTokens.roleplayDetail.quickLink}
                            >
                                <InlineIcon icon={Target} className={uiTokens.roleplayDetail.quickLinkIcon} />
                                État des compétences
                            </ContextualLink>
                        </Box>
                    </Box>

                    <Box className="mt-6 flex flex-col items-center text-center">
                        <Box className="h-[124px] w-[124px] overflow-hidden rounded-full border-4 border-[#E7DCFB] shadow-[0_10px_28px_rgba(81,64,240,0.18)]">
                            <Box
                                aria-label={roleplay.name}
                                role="img"
                                className="h-full w-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
                            />
                        </Box>
                        <Box className="mt-4 flex items-center gap-3">
                            <Text as="h1" className="text-[28px] font-extrabold text-[#111827]">
                                {roleplay.name}
                            </Text>
                            <DiscProfileBadge
                                profile={roleplay.disc}
                                className="h-7 border-0 px-3 text-[13px]"
                            />
                        </Box>
                        <Text className="mt-1 text-[15px] font-semibold text-[#596273]">
                            {roleplay.role} @{roleplay.company}
                        </Text>

                        <Box className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                            {detail.infoChips.map((chip) => (
                                <Box
                                    key={chip.label}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563]"
                                >
                                    <InlineIcon icon={roleplayChipIcons[chip.icon]} className="h-4 w-4 text-[#9CA3AF]" />
                                    {chip.label}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Text className="mt-8 text-center text-[15px] font-bold text-[#374151]">
                        Vos statistiques et compétences
                    </Text>
                    <Box className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <CardSurface className="rounded-[14px] border border-[#E5E7EB] p-5 text-center shadow-none">
                            <Text className="text-[13px] font-bold text-[#4B5563]">Score actuel</Text>
                            <Text className="mt-2 text-[30px] font-extrabold text-[#EA580C]">
                                {detail.scoreActuel}%
                            </Text>
                            <Box className={cn(uiTokens.metadata.dateBadge, "mx-auto mt-2")}>
                                <InlineIcon icon={CalendarDays} className={uiTokens.metadata.dateBadgeIcon} />
                                {detail.lastDate}
                            </Box>
                            <Text className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">Dernière simulation</Text>
                        </CardSurface>
                        <CardSurface className="rounded-[14px] border border-[#E5E7EB] p-5 text-center shadow-none">
                            <Text className="text-[13px] font-bold text-[#4B5563]">Meilleur score</Text>
                            <Text className="mt-2 text-[30px] font-extrabold text-[#16A34A]">
                                {detail.meilleurScore}%
                            </Text>
                            <Box className={cn(uiTokens.metadata.dateBadge, "mx-auto mt-2")}>
                                <InlineIcon icon={CalendarDays} className={uiTokens.metadata.dateBadgeIcon} />
                                {detail.bestScoreDate ?? "Aucune session"}
                            </Box>
                            <Text className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">
                                Sur {detail.simulations} tentatives
                            </Text>
                        </CardSurface>
                        <CardSurface className="rounded-[14px] border border-[#E5E7EB] p-5 text-center shadow-none">
                            <Text className="text-[13px] font-bold text-[#4B5563]">Simulations</Text>
                            <Text className="mt-2 text-[30px] font-extrabold text-[#111827]">
                                {detail.simulations}
                            </Text>
                            <Text className="mt-1 text-[12px] font-medium text-[#9CA3AF]">Tentatives effectuées</Text>
                        </CardSurface>
                        <RoleplayIndexSummaryCard
                            delta={detail.indexDelta ?? null}
                            score={detail.indexScore ?? null}
                            sessions={detail.indexSessions ?? []}
                            sessionCount={detail.indexSessionCount ?? 0}
                            trend={detail.indexTrend}
                        />
                    </Box>

                    <Text as="h2" className={uiTokens.roleplayDetail.title}>
                        {roleplay.title || roleplay.category}
                    </Text>

                    <Box className="mt-3">
                        <InfoBox title="Contexte">{detail.context}</InfoBox>
                    </Box>
                    <Box className="mt-4">
                        <InfoBox title="Votre rôle">
                            {detail.learnerRole || "Rôle non renseigné."}
                        </InfoBox>
                    </Box>
                    <Box className="mt-4 grid gap-4 md:grid-cols-2">
                        <InfoBox title="Objectif">{roleplay.description}</InfoBox>
                        <InfoBox title="Objections">{detail.objections}</InfoBox>
                    </Box>

                    <Text as="h2" className="mt-8 text-[18px] font-extrabold text-[#5140F0]">
                        Préparation avant entraînement
                    </Text>
                    <Box className="mt-4 grid gap-4 md:grid-cols-3">
                        <PrepCard
                            title={`Méthode : ${detail.method}`}
                            description="4 étapes pédagogiques pour structurer votre approche"
                            cta="Découvrir"
                            href={`/methods/${roleplay.methodId}`}
                        />
                        <PrepCard
                            title="Quiz de connaissances"
                            description="Vérifiez que vous maîtrisez les bases avant la simulation."
                            cta="Vérifier mes connaissances"
                            onClick={() => setActiveModal("quiz")}
                        />
                        <PrepCard
                            title="Documents pour la préparation"
                            description="Accédez aux ressources nécessaires pour ce scénario"
                            cta="Accéder"
                            onClick={() => setActiveModal("documents")}
                        />
                    </Box>

                    <Box className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        {roleplay.latestEvaluationSessionId && (
                            <ContextualLink
                                href={ROLEPLAY_ROUTES.app.sessionHistoryDetail(roleplay.latestEvaluationSessionId)}
                                className={`flex h-12 items-center justify-center rounded-xl px-6 text-[15px] font-bold transition ${uiTokens.action.successButton}`}
                            >
                                Évaluation de l&apos;entraînement complet
                            </ContextualLink>
                        )}
                        <ContextualLink
                            href={`/roleplays/${roleplay.id}/session`}
                            className="flex h-12 items-center justify-center rounded-xl bg-[#5140F0] px-6 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.24)] transition hover:bg-[#4635E7]"
                        >
                            Commencer l&apos;entraînement complet
                        </ContextualLink>
                        <ContextualLink
                            href={`/roleplays/${roleplay.id}/steps`}
                            className="flex h-12 items-center justify-center rounded-xl border border-[#C9C2FB] bg-white px-6 text-[15px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                        >
                            Se préparer sur une étape spécifique
                        </ContextualLink>
                    </Box>
                </CardSurface>
            </Box>

            {activeModal === "quiz" && (
                <RoleplayQuizModal
                    quizzes={prepQuizzes}
                    returnHref={withSearchParam(currentHref, "panel", "quizzes")}
                    onClose={closeModal}
                />
            )}
            {activeModal === "documents" && (
                <RoleplayDocumentsModal documents={prepDocuments} onClose={closeModal} />
            )}
        </Box>
    );
}
