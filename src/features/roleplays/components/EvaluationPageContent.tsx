"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock,
    Download,
    Info,
    MessageSquare,
    MoreVertical,
    Phone,
    Search,
    ShieldCheck,
    Sparkles,
    Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    categoryBadgeStyles,
    discBadgeStyles,
    difficultyBadgeStyles,
} from "@/features/roleplays/data/roleplays";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { evaluation, stepStatusStyles } from "@/features/roleplays/data/evaluation";
import type { EvaluationStep } from "@/features/roleplays/data/evaluation";

const stepIcons: Record<EvaluationStep["icon"], { icon: LucideIcon; bg: string; color: string }> = {
    phone: { icon: Phone, bg: "#E7EDFD", color: "#3B6FD0" },
    message: { icon: MessageSquare, bg: "#F3E8FD", color: "#8B2FD6" },
    shield: { icon: ShieldCheck, bg: "#E7F9ED", color: "#16A34A" },
    check: { icon: CheckCircle2, bg: "#FEECF0", color: "#E11D6B" },
};

function scoreColor(score: number) {
    if (score >= 80) {
        return "#16A34A";
    }
    if (score >= 60) {
        return "#F59E0B";
    }
    return "#F97316";
}

function Ring({ score, size = 110, stroke = 11 }: { score: number; size?: number; stroke?: number }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const color = scoreColor(score);

    return (
        <Box className="relative" style={{ width: size, height: size }}>
            <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ECEEF3" strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <Box className="absolute inset-0 flex items-center justify-center">
                <Text className="text-[22px] font-extrabold" style={{ color }}>
                    {score}%
                </Text>
            </Box>
        </Box>
    );
}

const TABS = ["Synthèse globale", "Analyse méthodologique", "Analyse discours", "Transcription"] as const;
type TabName = (typeof TABS)[number];

interface EvaluationPageContentProps {
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

export function EvaluationPageContent({ roleplay, session }: EvaluationPageContentProps) {
    const [activeTab, setActiveTab] = useState<TabName>("Synthèse globale");
    const [openStep, setOpenStep] = useState<EvaluationStep | null>(null);
    const [transcriptQuery, setTranscriptQuery] = useState("");

    const categoryStyle = categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
    const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
    const discStyle = discBadgeStyles[roleplay.disc];

    const filteredTranscript = useMemo(() => {
        const q = transcriptQuery.trim().toLowerCase();
        if (!q) {
            return evaluation.transcript;
        }
        return evaluation.transcript.filter((message) => message.text.toLowerCase().includes(q));
    }, [transcriptQuery]);

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5 flex items-center justify-between gap-4">
                    <Box className="flex items-center gap-4">
                        <Link
                            href="/roleplays/history"
                            aria-label="Retour"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </Link>
                        <Text as="h1" className="text-[28px] font-extrabold leading-tight text-[#111827] md:text-[32px]">
                            Évaluation de la simulation
                        </Text>
                    </Box>
                    <Box className="flex items-center gap-2">
                        <Button className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]">
                            <InlineIcon icon={Download} className="h-4 w-4" />
                            Exporter PDF
                        </Button>
                        <Button
                            aria-label="Plus d'options"
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE]"
                        >
                            <InlineIcon icon={MoreVertical} className="h-5 w-5" />
                        </Button>
                    </Box>
                </Box>

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-8">
                    <Box className="mb-4 flex items-center justify-end gap-2">
                        <Box className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                        <Text className="text-[14px] font-bold text-[#16A34A]">Données synchronisées</Text>
                    </Box>

                    <Box className="flex flex-col gap-4 rounded-[14px] bg-[#F7F8FB] px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <Box className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-semibold text-[#4B5563]">
                            <Box className="flex items-center gap-2">
                                <InlineIcon icon={CalendarDays} className="h-4 w-4 text-[#9CA3AF]" />
                                Réalisé le {session.date} • 21:17
                            </Box>
                            <Box className="flex items-center gap-2">
                                <InlineIcon icon={Clock} className="h-4 w-4 text-[#9CA3AF]" />
                                Durée session: {session.duration}
                            </Box>
                        </Box>
                        <Box
                            className="inline-flex h-9 w-fit items-center rounded-lg px-3.5 text-[13px] font-bold"
                            style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                        >
                            {roleplay.category}
                        </Box>
                    </Box>

                    <Box className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
                        <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                            <Box className="flex items-center gap-3">
                                <Box className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7EDFD]">
                                    <InlineIcon icon={Info} className="h-5 w-5 text-[#3B6FD0]" />
                                </Box>
                                <Text as="h3" className="text-[17px] font-bold text-[#111827]">
                                    Situation
                                </Text>
                            </Box>
                            <Box className="mt-4 space-y-3">
                                <Box className="grid grid-cols-[88px_1fr] gap-3">
                                    <Text className="text-[13px] font-semibold text-[#9CA3AF]">Contexte</Text>
                                    <Text className="text-[14px] font-medium leading-6 text-[#3F4654]">
                                        {evaluation.steps.length > 0 ? roleplay.detail.context : ""}
                                    </Text>
                                </Box>
                                <Box className="grid grid-cols-[88px_1fr] gap-3">
                                    <Text className="text-[13px] font-semibold text-[#9CA3AF]">Objectif</Text>
                                    <Text className="text-[14px] font-medium leading-6 text-[#3F4654]">
                                        {roleplay.description}
                                    </Text>
                                </Box>
                            </Box>
                        </CardSurface>

                        <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 text-center shadow-none">
                            <Box className="flex items-center gap-3">
                                <Box className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF]">
                                    <InlineIcon icon={Info} className="h-5 w-5 text-[#5140F0]" />
                                </Box>
                                <Text as="h3" className="text-[17px] font-bold text-[#111827]">
                                    Persona
                                </Text>
                            </Box>
                            <Box className="mx-auto mt-4 h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-[#E7EAFF]">
                                <Box
                                    aria-label={roleplay.name}
                                    role="img"
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
                                />
                            </Box>
                            <Box className="mt-2 flex items-center justify-center gap-2">
                                <Text className="text-[15px] font-extrabold text-[#111827]">{roleplay.name}</Text>
                                <Box className="inline-flex h-5 items-center rounded-md bg-[#EEF0FF] px-1.5 text-[10px] font-bold text-[#5140F0]">
                                    AI
                                </Box>
                            </Box>
                            <Text className="text-[13px] font-semibold text-[#6B7280]">
                                {roleplay.role}
                                <br />@ {roleplay.company}
                            </Text>
                            <Box className="mt-2 flex items-center justify-center gap-2">
                                <Box
                                    className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-bold uppercase"
                                    style={{ backgroundColor: discStyle.bg, color: discStyle.text }}
                                >
                                    {roleplay.disc}
                                </Box>
                                <Box
                                    className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-bold"
                                    style={{ backgroundColor: difficultyStyle.bg, color: difficultyStyle.text }}
                                >
                                    {roleplay.difficulty}
                                </Box>
                            </Box>
                        </CardSurface>

                        <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 text-center shadow-none">
                            <Box className="flex items-center gap-3">
                                <Box className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F9ED]">
                                    <InlineIcon icon={CheckCircle2} className="h-5 w-5 text-[#16A34A]" />
                                </Box>
                                <Text as="h3" className="text-[17px] font-bold text-[#111827]">
                                    Score
                                </Text>
                            </Box>
                            <Box className="mt-3 flex justify-center">
                                <Ring score={session.score} />
                            </Box>
                            <Box
                                className="mx-auto mt-2 inline-flex h-6 items-center rounded-md px-2.5 text-[12px] font-bold"
                                style={{ backgroundColor: "#FFF7ED", color: "#C2410C" }}
                            >
                                {roleplay.difficulty}
                            </Box>
                        </CardSurface>
                    </Box>

                    <Box className="mt-5 flex flex-col gap-3 rounded-[14px] bg-[#F7F8FB] px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <Text className="text-[14px] font-semibold text-[#3F4654]">
                            L&apos;Analyse méthodologique est basée sur la méthode{" "}
                            <Text as="span" className="font-extrabold text-[#111827]">
                                {roleplay.detail.method.split(" - ")[0]}
                            </Text>
                        </Text>
                        <Button className="flex items-center gap-1.5 text-[14px] font-bold text-[#5140F0]">
                            Découvrir la méthode
                            <InlineIcon icon={ChevronDown} className="h-4 w-4 -rotate-90" />
                        </Button>
                    </Box>

                    <Box
                        role="tablist"
                        className="mt-7 flex flex-wrap gap-x-7 gap-y-2 border-b border-[#ECEEF3]"
                    >
                        {TABS.map((tab) => {
                            const isActive = tab === activeTab;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveTab(tab)}
                                    className={`-mb-px border-b-2 pb-3 text-[15px] font-bold transition ${
                                        isActive
                                            ? "border-[#5140F0] text-[#5140F0]"
                                            : "border-transparent text-[#6B7280] hover:text-[#374151]"
                                    }`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </Box>

                    <Box className="mt-6">
                        {activeTab === "Synthèse globale" && <SyntheseTab />}
                        {activeTab === "Analyse méthodologique" && (
                            <MethodologieTab onOpenStep={setOpenStep} />
                        )}
                        {activeTab === "Analyse discours" && <DiscoursTab />}
                        {activeTab === "Transcription" && (
                            <TranscriptionTab
                                query={transcriptQuery}
                                onQueryChange={setTranscriptQuery}
                                messages={filteredTranscript}
                                personaName={roleplay.name}
                            />
                        )}
                    </Box>
                </CardSurface>
            </Box>

            {openStep && <StepModal step={openStep} onClose={() => setOpenStep(null)} />}
        </Box>
    );
}

function SyntheseTab() {
    return (
        <Box className="space-y-5">
            <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <Box className="flex items-center justify-between gap-4">
                    <Box className="flex items-center gap-3">
                        <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7EDFD]">
                            <InlineIcon icon={MessageSquare} className="h-[18px] w-[18px] text-[#3B6FD0]" />
                        </Box>
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            Avis et ressenti du persona IA
                        </Text>
                    </Box>
                    <Button className="flex h-9 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]">
                        <InlineIcon icon={Video} className="h-4 w-4 text-[#5140F0]" />
                        Ask AI persona
                    </Button>
                </Box>
                <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">
                    {evaluation.personaAvis}
                </Text>
            </CardSurface>

            <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <Box className="flex items-center gap-3">
                    <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3E8FD]">
                        <InlineIcon icon={Phone} className="h-[18px] w-[18px] text-[#8B2FD6]" />
                    </Box>
                    <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                        Appréciation globale par le coach IA
                    </Text>
                </Box>
                <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">
                    {evaluation.coachAppreciation}
                </Text>
            </CardSurface>

            <Box className="grid gap-5 lg:grid-cols-2">
                <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                    <Box className="flex items-center gap-3">
                        <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F9ED]">
                            <InlineIcon icon={CheckCircle2} className="h-[18px] w-[18px] text-[#16A34A]" />
                        </Box>
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            Points positifs
                        </Text>
                    </Box>
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#6B7280]">
                        Réussites observées
                    </Text>
                    <Box className="mt-2 space-y-2.5">
                        {evaluation.pointsPositifs.map((item) => (
                            <Box key={item} className="flex gap-2.5">
                                <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                                <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                            </Box>
                        ))}
                    </Box>
                </CardSurface>

                <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                    <Box className="flex items-center gap-3">
                        <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEECEF]">
                            <InlineIcon icon={Info} className="h-[18px] w-[18px] text-[#E11D48]" />
                        </Box>
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            Axes d&apos;amélioration
                        </Text>
                    </Box>
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#E11D48]">
                        Axes d&apos;amélioration
                    </Text>
                    <Box className="mt-2 space-y-2.5">
                        {evaluation.axesAmelioration.map((item) => (
                            <Box key={item} className="flex gap-2.5">
                                <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E11D48]" />
                                <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                            </Box>
                        ))}
                    </Box>
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#E11D48]">
                        Priorité stratégique
                    </Text>
                    <Text className="mt-2 text-[14px] font-medium leading-6 text-[#4B5563]">
                        {evaluation.prioriteStrategique}
                    </Text>
                </CardSurface>
            </Box>

            <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <Box className="flex items-center justify-between gap-4">
                    <Box className="flex items-center gap-3">
                        <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF0FF]">
                            <InlineIcon icon={Sparkles} className="h-[18px] w-[18px] text-[#5140F0]" />
                        </Box>
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            Plan de progrès
                        </Text>
                    </Box>
                    <Button className="flex h-9 items-center gap-2 rounded-lg border border-[#C9C2FB] bg-white px-3 text-[13px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]">
                        <InlineIcon icon={Sparkles} className="h-4 w-4" />
                        S&apos;améliorer avec l&apos;IA
                    </Button>
                </Box>
                <Box className="mt-4 inline-flex h-7 items-center rounded-lg bg-[#EEF0FF] px-3 text-[12px] font-bold text-[#5140F0]">
                    Étape {evaluation.planEtape.number} • {evaluation.planEtape.title}
                </Box>
                <Box className="mt-3 flex gap-2.5">
                    <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5140F0]" />
                    <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">
                        {evaluation.planEtape.text}
                    </Text>
                </Box>
            </CardSurface>

            <CardSurface className="flex flex-col gap-4 rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-6 shadow-none md:flex-row md:items-center md:justify-between">
                <Box>
                    <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                        Besoin d&apos;approfondir votre analyse ?
                    </Text>
                    <Text className="mt-1 text-[14px] font-medium text-[#6B7280]">
                        Discutez en direct avec votre coach IA pour obtenir des conseils personnalisés sur votre
                        performance
                    </Text>
                </Box>
                <Button className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white transition hover:bg-[#4635E7]">
                    <InlineIcon icon={Video} className="h-4 w-4" />
                    Débriefer avec mon coach IA
                </Button>
            </CardSurface>
        </Box>
    );
}

function MethodologieTab({ onOpenStep }: { onOpenStep: (step: EvaluationStep) => void }) {
    return (
        <Box className="space-y-4">
            {evaluation.steps.map((step) => {
                const iconConfig = stepIcons[step.icon];
                const status = stepStatusStyles[step.status];
                return (
                    <CardSurface
                        key={step.number}
                        className="flex flex-col gap-4 rounded-[14px] border border-[#E5E7EB] p-5 shadow-none md:flex-row md:items-center md:justify-between"
                    >
                        <Box className="flex items-center gap-4">
                            <Box
                                className="flex h-11 w-11 items-center justify-center rounded-full"
                                style={{ backgroundColor: iconConfig.bg, color: iconConfig.color }}
                            >
                                <InlineIcon icon={iconConfig.icon} className="h-5 w-5" />
                            </Box>
                            <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                                Étape {step.number} : {step.title}
                            </Text>
                        </Box>
                        <Box className="flex items-center gap-5">
                            <Ring score={step.score} size={64} stroke={7} />
                            <Box
                                className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-bold"
                                style={{ backgroundColor: status.bg, color: status.text }}
                            >
                                {step.status}
                            </Box>
                            <Button
                                onClick={() => onOpenStep(step)}
                                className="flex items-center gap-1.5 text-[14px] font-bold text-[#5140F0]"
                            >
                                Voir l&apos;analyse détaillée
                                <InlineIcon icon={ChevronDown} className="h-4 w-4" />
                            </Button>
                        </Box>
                    </CardSurface>
                );
            })}
        </Box>
    );
}

function DiscoursTab() {
    return (
        <Box className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {evaluation.discourse.map((metric) => (
                <CardSurface
                    key={metric.title}
                    className="flex min-h-[160px] flex-col rounded-[14px] border border-[#E5E7EB] p-6 shadow-none"
                >
                    <Box className="flex items-center gap-1.5">
                        <Text className="text-[14px] font-semibold text-[#4B5563]">{metric.title}</Text>
                        <InlineIcon icon={Info} className="h-3.5 w-3.5 text-[#C9CED8]" />
                    </Box>
                    <Text className="mt-3 text-[34px] font-extrabold leading-none text-[#111827]">
                        {metric.value}
                    </Text>
                    {metric.subtitle && (
                        <Box className="mt-auto flex items-center gap-2 pt-4">
                            {metric.reco && (
                                <Box
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: metric.reco === "ok" ? "#22C55E" : "#EF4444" }}
                                />
                            )}
                            <Text className="text-[13px] font-medium text-[#6B7280]">{metric.subtitle}</Text>
                        </Box>
                    )}
                </CardSurface>
            ))}
        </Box>
    );
}

function TranscriptionTab({
    query,
    onQueryChange,
    messages,
    personaName,
}: {
    query: string;
    onQueryChange: (value: string) => void;
    messages: typeof evaluation.transcript;
    personaName: string;
}) {
    return (
        <Box>
            <Box className="relative mb-5">
                <InlineIcon
                    icon={Search}
                    className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
                />
                <input
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Rechercher dans la transcription..."
                    aria-label="Rechercher dans la transcription"
                    className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10"
                />
            </Box>

            <CardSurface className="space-y-5 rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                {messages.length === 0 ? (
                    <Text className="py-6 text-center text-[14px] font-semibold text-[#9CA3AF]">
                        Aucun résultat dans la transcription.
                    </Text>
                ) : (
                    messages.map((message, index) => {
                        const isPersona = message.speaker === "persona";
                        return (
                            <Box
                                key={index}
                                className={`flex gap-3 ${isPersona ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <Box
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                        isPersona ? "bg-[#5140F0] text-white" : "bg-[#EEF0F5] text-[#6B7280]"
                                    }`}
                                >
                                    {isPersona ? "AI" : "Moi"}
                                </Box>
                                <Box className={`max-w-[78%] ${isPersona ? "text-right" : "text-left"}`}>
                                    <Box
                                        className={`flex items-center gap-2 text-[12px] font-semibold text-[#9CA3AF] ${
                                            isPersona ? "justify-end" : "justify-start"
                                        }`}
                                    >
                                        <Text as="span">{isPersona ? personaName : "You"}</Text>
                                        <Text as="span">{message.time}</Text>
                                    </Box>
                                    <Box
                                        className={`mt-1.5 rounded-2xl px-4 py-2.5 text-[14px] font-medium leading-6 ${
                                            isPersona
                                                ? "bg-[#EEF0FF] text-[#1F2433]"
                                                : "bg-[#F3F4F6] text-[#1F2433]"
                                        }`}
                                    >
                                        {message.text}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })
                )}
            </CardSurface>
        </Box>
    );
}

function StepModal({ step, onClose }: { step: EvaluationStep; onClose: () => void }) {
    return (
        <Box className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
            <button
                type="button"
                aria-label="Fermer"
                onClick={onClose}
                className="fixed inset-0 bg-[#111827]/40"
            />
            <CardSurface className="relative z-10 my-4 w-full max-w-[1180px] overflow-hidden rounded-[18px] shadow-[0_30px_70px_rgba(17,24,39,0.28)]">
                <Box className="flex items-center justify-between border-b border-[#ECEEF3] bg-gradient-to-r from-[#F4F0FE] to-[#FBFAFE] px-7 py-5">
                    <Text as="h2" className="text-[20px] font-extrabold text-[#111827]">
                        Étape {step.number} : {step.title}
                    </Text>
                    <Button
                        aria-label="Fermer"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-white"
                    >
                        <InlineIcon icon={ChevronDown} className="hidden" />
                        <span className="text-[20px] leading-none">×</span>
                    </Button>
                </Box>

                <Box className="max-h-[72vh] overflow-y-auto px-7 py-6">
                    <Text as="h3" className="text-[17px] font-extrabold text-[#111827]">
                        Grille d&apos;analyse détaillée
                    </Text>
                    <Box className="mt-4 overflow-x-auto rounded-[12px] border border-[#E5E7EB]">
                        <table className="w-full min-w-[920px] border-collapse text-left">
                            <thead>
                                <tr className="bg-[#F7F8FB] text-[13px] font-bold text-[#4B5563]">
                                    {[
                                        "Critère clé",
                                        "Preuves attendues",
                                        "Points",
                                        "Preuves observées",
                                        "Analyse",
                                        "Conseils d'améliorations",
                                        "Verbatim préconisé",
                                    ].map((header) => (
                                        <th key={header} className="px-4 py-3 align-top">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {step.criteria.map((criterion) => (
                                    <tr
                                        key={criterion.critere}
                                        className="border-t border-[#ECEEF3] align-top text-[13px]"
                                    >
                                        <td className="px-4 py-4 font-bold text-[#111827]">{criterion.critere}</td>
                                        <td className="px-4 py-4 font-medium leading-6 text-[#4B5563]">
                                            {criterion.preuvesAttendues}
                                        </td>
                                        <td className="px-4 py-4">
                                            <Box className="inline-flex items-center rounded-md bg-[#FEF3C7] px-2 py-1 text-[12px] font-bold text-[#B45309]">
                                                {criterion.points}
                                            </Box>
                                        </td>
                                        <td className="px-4 py-4">
                                            {criterion.preuvesObservees.length === 0 ? (
                                                <Text className="text-[#9CA3AF]">-</Text>
                                            ) : (
                                                <Box className="space-y-3">
                                                    {criterion.preuvesObservees.map((proof, proofIndex) => (
                                                        <Box key={proofIndex}>
                                                            <Text className="font-medium italic leading-6 text-[#374151]">
                                                                « {proof.quote} »
                                                            </Text>
                                                            <Text className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">
                                                                {proof.speaker} · {proof.time}
                                                            </Text>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 font-medium leading-6 text-[#4B5563]">
                                            {criterion.analyse}
                                        </td>
                                        <td className="px-4 py-4 font-medium leading-6 text-[#5140F0]">
                                            {criterion.conseils}
                                        </td>
                                        <td className="px-4 py-4">
                                            <Box className="rounded-lg bg-[#E7F9ED] px-3 py-2 font-medium italic leading-6 text-[#1F7A3D]">
                                                « {criterion.verbatim} »
                                            </Box>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="border-t border-[#ECEEF3] bg-[#F7F8FB] text-[13px] font-extrabold text-[#111827]">
                                    <td className="px-4 py-3" colSpan={2}>
                                        TOTAL
                                    </td>
                                    <td className="px-4 py-3" colSpan={3}>
                                        {step.total}
                                    </td>
                                    <td className="px-4 py-3">SCORE</td>
                                    <td className="px-4 py-3" style={{ color: scoreColor(step.score) }}>
                                        {step.score}%
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Box>
                </Box>
            </CardSurface>
        </Box>
    );
}
