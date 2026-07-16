import {
    BadgeEuro,
    Brain,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    CircleHelp,
    Clock3,
    Compass,
    Ear,
    Flag,
    Gauge,
    Handshake,
    Lightbulb,
    ListTodo,
    MessageSquare,
    PenLine,
    Phone,
    Presentation,
    Puzzle,
    RefreshCw,
    Scale,
    Search,
    Send,
    ShieldCheck,
    Target,
    Trophy,
    UsersRound,
    Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    METHOD_STEP_ICON_LABELS,
    METHOD_STEP_ICONS,
    type MethodStepIcon,
} from "@/features/methods/domain/method";

const METHOD_STEP_ICON_PALETTES = {
    amber: { bg: "#FEF3C7", color: "#A16207" },
    blue: { bg: "#E7EDFD", color: "#3B6FD0" },
    cyan: { bg: "#CFFAFE", color: "#0E7490" },
    green: { bg: "#E7F9ED", color: "#15803D" },
    rose: { bg: "#FEECF0", color: "#BE123C" },
    violet: { bg: "#F3E8FD", color: "#8B2FD6" },
} as const;

type MethodStepIconTone = keyof typeof METHOD_STEP_ICON_PALETTES;

const METHOD_STEP_ICON_VISUALS = {
    phone: { icon: Phone, tone: "blue" },
    message: { icon: MessageSquare, tone: "violet" },
    ear: { icon: Ear, tone: "cyan" },
    question: { icon: CircleHelp, tone: "amber" },
    presentation: { icon: Presentation, tone: "violet" },
    handshake: { icon: Handshake, tone: "green" },
    users: { icon: UsersRound, tone: "blue" },
    search: { icon: Search, tone: "cyan" },
    target: { icon: Target, tone: "rose" },
    compass: { icon: Compass, tone: "blue" },
    lightbulb: { icon: Lightbulb, tone: "amber" },
    brain: { icon: Brain, tone: "violet" },
    pen: { icon: PenLine, tone: "blue" },
    plan: { icon: ListTodo, tone: "green" },
    calendar: { icon: CalendarDays, tone: "violet" },
    clock: { icon: Clock3, tone: "amber" },
    send: { icon: Send, tone: "cyan" },
    repeat: { icon: RefreshCw, tone: "violet" },
    flag: { icon: Flag, tone: "rose" },
    briefcase: { icon: BriefcaseBusiness, tone: "blue" },
    euro: { icon: BadgeEuro, tone: "green" },
    scale: { icon: Scale, tone: "amber" },
    puzzle: { icon: Puzzle, tone: "violet" },
    shield: { icon: ShieldCheck, tone: "green" },
    check: { icon: CheckCircle2, tone: "rose" },
    gauge: { icon: Gauge, tone: "cyan" },
    trophy: { icon: Trophy, tone: "amber" },
    zap: { icon: Zap, tone: "rose" },
} satisfies Record<MethodStepIcon, { icon: LucideIcon; tone: MethodStepIconTone }>;

export const METHOD_STEP_ICON_OPTIONS = METHOD_STEP_ICONS.map((value) => ({
    icon: METHOD_STEP_ICON_VISUALS[value].icon,
    label: METHOD_STEP_ICON_LABELS[value],
    value,
}));

export function getMethodStepIconPresentation(value: MethodStepIcon) {
    const visual = METHOD_STEP_ICON_VISUALS[value];

    return {
        icon: visual.icon,
        ...METHOD_STEP_ICON_PALETTES[visual.tone],
    };
}
