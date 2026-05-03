import {
    BookOpen,
    BotMessageSquare,
    Building2,
    ChevronDown,
    GraduationCap,
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
    { icon: Grid2X2, label: "Tableau de bord" },
    // { icon: GraduationCap, label: "Académie" },
    // { icon: BookOpen, label: "Programmes" },
    { icon: MessagesSquare, label: "Roleplays" },
    { icon: BookOpen, label: "Méthodes et Playbook" },
    { icon: Star, label: "Compétences" },
    { icon: BotMessageSquare, label: "Mes Coachs IA" },
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
