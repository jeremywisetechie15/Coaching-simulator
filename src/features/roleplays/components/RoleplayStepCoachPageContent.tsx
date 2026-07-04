"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Method, MethodStep } from "@/features/methods/data/methods";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { cn } from "@/lib/ui/utils/cn";
import { SimulationView } from "./SimulationView";

/** « prepare » = avant la session (before_training) ; « improve » = après, depuis l'évaluation (after_training). */
export type StepCoachVariant = "prepare" | "improve";

interface RoleplayStepCoachPageContentProps {
    roleplay: RoleplayItem;
    method: Method;
    step: MethodStep;
    /** Position de l'étape (1-indexée). */
    stepNumber: number;
    variant?: StepCoachVariant;
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
                    <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
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
    variant = "prepare",
}: RoleplayStepCoachPageContentProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TipTabKey>("conseils");

    const tipItems: Record<TipTabKey, string[]> = {
        conseils: step.posture,
        pratiques: step.bonnesPratiques,
        pieges: step.erreurs,
    };
    const activeTabConfig = tipTabs.find((tab) => tab.key === activeTab)!;

    const isImprove = variant === "improve";
    const coachMode = isImprove ? "after_training" : "before_training";
    const verb = isImprove ? "S'améliorer" : "Se préparer";
    const stepsHref = `/roleplays/${roleplay.id}/steps${isImprove ? "?coach=after" : ""}`;

    // Embarque le runtime public existant sans le modifier (contrat iframe) ; seul `coach_mode` varie.
    const iframeSrc = roleplay.scenarioId
        ? `/iframe?scenario_id=${roleplay.scenarioId}&mode=coach&coach_mode=${coachMode}&step=${stepNumber}`
        : null;

    const tipsPanel = (
        <CardSurface className="rounded-[20px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
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
    );

    return (
        <SimulationView
            title={`Coach IA — ${verb} sur « ${step.title} » · ${method.name} · Étape ${stepNumber}`}
            liveTabLabel="AI Coach"
            iframeSrc={iframeSrc}
            personaName={roleplay.name}
            transcript={[]}
            onBack={() => router.push(stepsHref)}
            panel={tipsPanel}
        />
    );
}
