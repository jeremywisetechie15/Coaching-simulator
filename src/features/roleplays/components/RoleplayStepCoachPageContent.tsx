"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { cn } from "@/lib/ui/utils/cn";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { Method, MethodStep } from "@/features/methods/data/methods";

interface RoleplayStepCoachPageContentProps {
    roleplay: RoleplayItem;
    method: Method;
    step: MethodStep;
    /** Position de l'étape (1-indexée). */
    stepNumber: number;
}

type TipTabKey = "conseils" | "pratiques" | "pieges";

const tipTabs: { key: TipTabKey; label: string; icon: LucideIcon; accent: string }[] = [
    { key: "conseils", label: "Conseils de préparation", icon: Lightbulb, accent: "#5140F0" },
    { key: "pratiques", label: "Bonnes pratiques", icon: CheckCircle2, accent: "#16A34A" },
    { key: "pieges", label: "Pièges à éviter", icon: AlertTriangle, accent: "#DC2626" },
];

function TipList({ items, accent }: { items: string[]; accent: string }) {
    return (
        <Box className="space-y-2.5">
            {items.map((item) => (
                <Box key={item} className="flex gap-2.5">
                    <Box
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: accent }}
                    />
                    <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                </Box>
            ))}
        </Box>
    );
}

export function RoleplayStepCoachPageContent({
    roleplay,
    method,
    step,
    stepNumber,
}: RoleplayStepCoachPageContentProps) {
    const [activeTab, setActiveTab] = useState<TipTabKey>("conseils");

    const tipItems: Record<TipTabKey, string[]> = {
        conseils: step.posture,
        pratiques: step.bonnesPratiques,
        pieges: step.erreurs,
    };
    const activeTabConfig = tipTabs.find((tab) => tab.key === activeTab)!;

    const iframeSrc = roleplay.scenarioId
        ? `/iframe?scenario_id=${roleplay.scenarioId}&mode=coach&coach_mode=before_training&step=${stepNumber}`
        : null;

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5">
                    <Link
                        href={`/roleplays/${roleplay.id}/steps`}
                        className="flex h-10 w-fit items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                        Retour
                    </Link>
                </Box>

                <Box className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Box>
                        <Text className="text-[13px] font-semibold text-[#6B7280]">
                            {roleplay.name} · {method.name} · Étape {stepNumber}
                        </Text>
                        <Text as="h1" className="mt-0.5 text-[22px] font-extrabold text-[#111827]">
                            Coach IA — Se préparer sur «&nbsp;{step.title}&nbsp;»
                        </Text>
                    </Box>
                </Box>

                <CardSurface className="overflow-hidden rounded-[20px] border border-[#E9E7FB] p-0 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    {iframeSrc ? (
                        <iframe
                            title="Coach IA"
                            src={iframeSrc}
                            className="h-[640px] w-full border-0"
                            allow="microphone; camera; autoplay"
                        />
                    ) : (
                        <Box className="flex h-[360px] flex-col items-center justify-center gap-3 bg-[#F8F9FC] p-6 text-center">
                            <InlineIcon icon={AlertCircle} className="h-12 w-12 text-[#DC2626]" />
                            <Text className="text-[15px] font-bold text-[#374151]">
                                Coach IA indisponible pour ce scénario
                            </Text>
                            <Text className="max-w-[420px] text-[13px] font-medium leading-6 text-[#6B7280]">
                                Aucun identifiant de scénario n&apos;est associé à ce roleplay. Ajoutez un{" "}
                                <code className="rounded bg-white px-1.5 py-0.5 text-[12px]">scenarioId</code>{" "}
                                au roleplay pour activer la session de coaching.
                            </Text>
                        </Box>
                    )}
                </CardSurface>

                <CardSurface className="mt-5 rounded-[20px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    <Box className="flex flex-wrap gap-2 border-b border-[#EDEEF3] pb-3">
                        {tipTabs.map((tab) => {
                            const isActive = tab.key === activeTab;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        "flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13px] font-bold transition",
                                        isActive
                                            ? "text-white"
                                            : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#D5D7DE]",
                                    )}
                                    style={isActive ? { backgroundColor: tab.accent } : undefined}
                                >
                                    <InlineIcon icon={tab.icon} className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </Box>
                    <Box className="mt-4">
                        <TipList items={tipItems[activeTab]} accent={activeTabConfig.accent} />
                    </Box>
                </CardSurface>
            </Box>
        </Box>
    );
}
