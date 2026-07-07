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
import {
    APP_NAVIGATION_RESOURCE,
    type AppNavigationResource,
} from "@/features/auth/domain/access-control";
import { SHOW_ROLES_PERMISSIONS_NAVIGATION } from "@/features/permissions/domain";

export interface AppNavigationItem {
    href?: string;
    icon: LucideIcon;
    label: string;
    resource: AppNavigationResource;
}

export const primaryNavigation: AppNavigationItem[] = [
    { href: "/", icon: Grid2X2, label: "Tableau de bord", resource: APP_NAVIGATION_RESOURCE.dashboard },
    // { icon: GraduationCap, label: "Académie" },
    // { icon: BookOpen, label: "Programmes" },
    { href: "/roleplays", icon: MessagesSquare, label: "Roleplays", resource: APP_NAVIGATION_RESOURCE.roleplays },
    { href: "/methods", icon: BookOpen, label: "Méthodes et Playbook", resource: APP_NAVIGATION_RESOURCE.methods },
    { href: "/evaluations", icon: ClipboardCheck, label: "Évaluations", resource: APP_NAVIGATION_RESOURCE.evaluations },
    { href: "/scorecards", icon: ClipboardList, label: "Scorecards", resource: APP_NAVIGATION_RESOURCE.scorecards },
    { href: "/skills", icon: Star, label: "Compétences", resource: APP_NAVIGATION_RESOURCE.skills },
    { href: "/coaches", icon: BotMessageSquare, label: "Mes Coachs IA", resource: APP_NAVIGATION_RESOURCE.coaches },
    { href: "/personas", icon: UserRoundCog, label: "Mes Personas IA", resource: APP_NAVIGATION_RESOURCE.personas },
    { href: "/organizations", icon: Building2, label: "Organisations", resource: APP_NAVIGATION_RESOURCE.organizations },
    { href: "/users", icon: UsersRound, label: "Utilisateurs", resource: APP_NAVIGATION_RESOURCE.users },
];

export const accountNavigation = {
    icon: UserCircle,
    label: "Compte",
    trailingIcon: ChevronDown,
    items: [
        { href: "/profile", label: "Mon profil" },
        ...(SHOW_ROLES_PERMISSIONS_NAVIGATION
            ? [{ href: "/roles-permissions", label: "Rôles & Permissions" }]
            : []),
    ],
};

export const logoutNavigation = {
    icon: LogOut,
    label: "Déconnexion",
};
