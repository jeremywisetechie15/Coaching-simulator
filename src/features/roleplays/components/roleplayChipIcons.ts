import { Banknote, Building2, CalendarDays, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Icônes des « infoChips » d'un roleplay (source unique partagée par les écrans roleplay). */
export const roleplayChipIcons: Record<string, LucideIcon> = {
    building: Building2,
    calendar: CalendarDays,
    money: Banknote,
    users: Users,
};
