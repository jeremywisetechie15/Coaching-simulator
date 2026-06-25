import {
    BookOpen,
    BotMessageSquare,
    Building2,
    ChevronDown,
    ClipboardCheck,
    ClipboardList,
    Grid2X2,
    LogOut,
    MessagesSquare,
    Star,
    UserCircle,
    UserRoundCog,
    UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AppNavigationItem {
    href?: string;
    icon: LucideIcon;
    label: string;
}

export const primaryNavigation: AppNavigationItem[] = [
    { href: "/", icon: Grid2X2, label: "Tableau de bord" },
    // { icon: GraduationCap, label: "Académie" },
    // { icon: BookOpen, label: "Programmes" },
    { href: "/roleplays", icon: MessagesSquare, label: "Roleplays" },
    { href: "/methods", icon: BookOpen, label: "Méthodes et Playbook" },
    { href: "/evaluations", icon: ClipboardCheck, label: "Évaluations" },
    { href: "/scorecards", icon: ClipboardList, label: "Scorecards" },
    { href: "/skills", icon: Star, label: "Compétences" },
    { href: "/coaches", icon: BotMessageSquare, label: "Mes Coachs IA" },
    { href: "/personas", icon: UserRoundCog, label: "Mes Personas IA" },
    { href: "/organizations", icon: Building2, label: "Organisations" },
    { href: "/users", icon: UsersRound, label: "Utilisateurs" },
];

export const accountNavigation = {
    icon: UserCircle,
    label: "Compte",
    trailingIcon: ChevronDown,
    items: [
        { href: "/profile", label: "Mon profil" },
        { href: "/roles-permissions", label: "Rôles & Permissions" },
    ],
};

export const logoutNavigation = {
    icon: LogOut,
    label: "Déconnexion",
};
