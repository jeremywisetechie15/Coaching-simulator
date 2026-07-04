"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Copy, Edit3, FileText, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    getQuizKindLabel,
    getQuizStatusLabel,
    getQuizTypeLabel,
    type QuizListItem,
} from "@/features/evaluations/domain";
import { ALL_CONTENT_CATEGORIES, CONTENT_DOMAINS, getCategoriesForDomain } from "@/features/content/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { CardActionMenu, CardActionMenuButton, CardActionMenuLink } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface EvaluationsPageContentProps {
    canManage: boolean;
    quizzes: QuizListItem[];
}

interface ApiErrorPayload {
    error?: string;
}

async function duplicateQuiz(quizId: string) {
    const response = await fetch(`/api/quizzes/${quizId}/duplicate`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de dupliquer le quiz.");
    }
}

async function archiveQuiz(quizId: string) {
    const response = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'archiver le quiz.");
    }
}

export function EvaluationsPageContent({ canManage, quizzes }: EvaluationsPageContentProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [domain, setDomain] = useState("all");
    const [category, setCategory] = useState("all");
    const [type, setType] = useState("all");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busyQuizId, setBusyQuizId] = useState<string | null>(null);

    const domainOptions = ["all", ...CONTENT_DOMAINS];
    const categoryOptions = [
        "all",
        ...(domain === "all" ? ALL_CONTENT_CATEGORIES : getCategoriesForDomain(domain)),
    ];
    const typeOptions = useMemo(
        () => ["all", ...Array.from(new Set(quizzes.map((quiz) => getQuizTypeLabel(quiz.type))))],
        [quizzes],
    );

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        return quizzes.filter((quiz) => {
            const matchesTerm =
                !term ||
                [quiz.title, quiz.description, quiz.domain, quiz.category, quiz.methodName ?? "", ...quiz.tags]
                    .join(" ")
                    .toLowerCase()
                    .includes(term);
            const matchesDomain = domain === "all" || quiz.domain === domain;
            const matchesCategory = category === "all" || quiz.category === category;
            const matchesType = type === "all" || getQuizTypeLabel(quiz.type) === type;

            return matchesTerm && matchesDomain && matchesCategory && matchesType;
        });
    }, [category, domain, query, quizzes, type]);

    async function handleDuplicate(quizId: string) {
        setError(null);
        setBusyQuizId(quizId);

        try {
            await duplicateQuiz(quizId);
            router.refresh();
            setOpenMenuId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de dupliquer le quiz.");
        } finally {
            setBusyQuizId(null);
        }
    }

    async function handleArchive(quizId: string) {
        setError(null);
        setBusyQuizId(quizId);

        try {
            await archiveQuiz(quizId);
            router.refresh();
            setOpenMenuId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'archiver le quiz.");
        } finally {
            setBusyQuizId(null);
        }
    }

    function selectDomain(nextDomain: string) {
        setDomain(nextDomain);
        setCategory("all");
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <Box className="flex items-start gap-6">
                        <Link
                            href="/"
                            aria-label="Retour"
                            className={cn(
                                "mt-2 flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white",
                                uiTokens.text.heading,
                            )}
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </Link>
                        <Box>
                            <Text as="h1" className={cn("text-[30px] font-extrabold leading-tight md:text-[34px]", uiTokens.text.heading)}>
                                Évaluations
                            </Text>
                            <Text className={cn("mt-2 max-w-[680px] text-[15px] font-semibold leading-6", uiTokens.text.muted)}>
                                Gérez et créez vos quiz de connaissances et d’auto-positionnement.
                            </Text>
                        </Box>
                    </Box>

                    {canManage && (
                        <Link
                            href="/evaluations/new"
                            className={cn("mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg px-4 text-[13px] font-bold text-white transition md:mt-2", uiTokens.action.primaryButton)}
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Créer une évaluation
                        </Link>
                    )}
                </Box>

                {error && (
                    <CardSurface className="mb-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 shadow-none">
                        <Text className={cn("text-[13px] font-semibold", uiTokens.text.danger)}>{error}</Text>
                    </CardSurface>
                )}

                <CardSurface className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-none">
                    <Box className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
                        <Box className="relative">
                            <InlineIcon icon={Search} className={cn("pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2", uiTokens.text.muted)} />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Rechercher une évaluation..."
                                className={cn(uiTokens.form.control, "h-10 pl-11 text-[14px]")}
                            />
                        </Box>
                        <FilterSelect value={domain} onChange={selectDomain} options={domainOptions} allLabel="Tous les domaines" />
                        <FilterSelect value={category} onChange={setCategory} options={categoryOptions} allLabel="Toutes les catégories" />
                        <FilterSelect value={type} onChange={setType} options={typeOptions} allLabel="Tous les types" />
                    </Box>
                </CardSurface>

                <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((quiz) => (
                        <CardSurface
                            key={quiz.id}
                            className="group relative flex flex-col rounded-[16px] border border-[#E5E7EB] p-6 shadow-none transition hover:shadow-[0_16px_36px_rgba(17,24,39,0.08)]"
                        >
                            {canManage && (
                                <Box className="absolute right-4 top-4">
                                    <Button
                                        aria-label={`Actions pour ${quiz.title}`}
                                        onClick={() => setOpenMenuId(openMenuId === quiz.id ? null : quiz.id)}
                                        className={cn(uiTokens.action.iconButtonGhost, "opacity-100")}
                                    >
                                        <InlineIcon icon={MoreHorizontal} className="h-4 w-4" />
                                    </Button>
                                    {openMenuId === quiz.id && (
                                        <CardActionMenu>
                                            <CardActionMenuLink href={`/evaluations/${quiz.id}/edit`} icon={Edit3} label="Modifier" />
                                            <CardActionMenuButton
                                                disabled={busyQuizId === quiz.id}
                                                icon={Copy}
                                                label="Dupliquer"
                                                onClick={() => void handleDuplicate(quiz.id)}
                                            />
                                            <CardActionMenuButton
                                                danger
                                                disabled={busyQuizId === quiz.id}
                                                icon={Trash2}
                                                label="Supprimer"
                                                onClick={() => void handleArchive(quiz.id)}
                                            />
                                        </CardActionMenu>
                                    )}
                                </Box>
                            )}

                            <Box className="flex flex-wrap items-center gap-2 pr-8">
                                <Badge>{quiz.category || getQuizKindLabel(quiz.kind)}</Badge>
                                <Badge tone="purple">{getQuizTypeLabel(quiz.type)}</Badge>
                                <Badge tone={quiz.status === "published" ? "green" : "gray"}>{getQuizStatusLabel(quiz.status)}</Badge>
                            </Box>

                            <Text as="h3" className={cn("mt-4 text-[19px] font-extrabold leading-7", uiTokens.text.heading)}>
                                {quiz.title}
                            </Text>
                            <Text className={cn("mt-2 line-clamp-2 flex-1 text-[14px] font-medium leading-6", uiTokens.text.muted)}>
                                {quiz.description || "Aucune description renseignée."}
                            </Text>

                            <Box className="mt-4 flex flex-col gap-2">
                                <MetaLine icon={FileText} label={`${quiz.questionCount} question${quiz.questionCount > 1 ? "s" : ""}`} />
                                <MetaLine icon={Clock} label={`${quiz.durationMinutes} min`} />
                                <Text className={cn("text-[13px] font-semibold", quiz.methodName ? uiTokens.text.primary : uiTokens.text.muted)}>
                                    {quiz.methodName ?? "Aucune méthode associée"}
                                </Text>
                            </Box>

                            <Box className="mt-4 flex flex-wrap gap-2">
                                {quiz.tags.slice(0, 3).map((tag) => (
                                    <Box key={tag} className="inline-flex h-7 items-center rounded-md bg-[#F3F4F6] px-2.5 text-[12px] font-semibold text-[#4B5563]">
                                        {tag}
                                    </Box>
                                ))}
                                {quiz.tags.length > 3 && (
                                    <Box className="inline-flex h-7 items-center rounded-md bg-[#F3F4F6] px-2.5 text-[12px] font-semibold text-[#4B5563]">
                                        +{quiz.tags.length - 3}
                                    </Box>
                                )}
                            </Box>

                            <Link
                                href={`/evaluations/${quiz.id}`}
                                className={cn("mt-5 flex h-11 items-center justify-center rounded-xl text-[14px] font-bold text-white transition", uiTokens.action.primaryButton)}
                            >
                                Voir l’évaluation
                            </Link>
                        </CardSurface>
                    ))}
                </Box>

                {filtered.length === 0 && (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <Text className={cn("text-[16px] font-extrabold", uiTokens.text.heading)}>
                            Aucune évaluation trouvée
                        </Text>
                    </CardSurface>
                )}
            </Box>
        </Box>
    );
}

function FilterSelect({
    allLabel,
    onChange,
    options,
    value,
}: {
    allLabel: string;
    onChange: (value: string) => void;
    options: string[];
    value: string;
}) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(uiTokens.form.control, "h-10 px-3 text-[13px]")}
        >
            {options.map((option) => (
                <option key={option} value={option}>
                    {option === "all" ? allLabel : option}
                </option>
            ))}
        </select>
    );
}

function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "purple" | "green" | "gray" }) {
    const tones = {
        blue: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
        gray: "border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]",
        green: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]",
        purple: "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]",
    } as const;

    return (
        <Box className={cn("inline-flex h-7 items-center rounded-md border px-2.5 text-[12px] font-semibold", tones[tone])}>
            {children}
        </Box>
    );
}

function MetaLine({ icon, label }: { icon: LucideIcon; label: string }) {
    return (
        <Box className="flex items-center gap-2 text-[14px] font-semibold text-[#4B5563]">
            <InlineIcon icon={icon} className="h-4 w-4 text-[#9CA3AF]" />
            {label}
        </Box>
    );
}
