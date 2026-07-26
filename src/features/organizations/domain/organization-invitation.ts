import {
    ORGANIZATION_MEMBER_STATUS,
    type OrganizationMemberStatus,
} from "./organization-member";

export interface OrganizationInvitationResendTarget {
    organizationId: string;
    organizationName: string;
}

export const ORGANIZATION_INVITATION_RESEND_COOLDOWN_MS = 60_000;

export const ORGANIZATION_INVITATION_RESEND_LABEL = "Renvoyer l’invitation";
export const ORGANIZATION_INVITATION_RESEND_BUSY_LABEL = "Envoi...";
export const ORGANIZATION_INVITATION_RESEND_CONFIRMATION_MESSAGE =
    "L’utilisateur recevra un nouveau lien sécurisé pour créer son mot de passe.";

export const ORGANIZATION_INVITATION_RESEND_MESSAGES = {
    conflict: "L’invitation ne peut être renvoyée que si l’utilisateur est encore invité.",
    emailMissing: "Aucune adresse email Auth n’est associée à cet utilisateur.",
    failed: "La nouvelle invitation n’a pas pu être envoyée. Réessayez dans quelques instants.",
    notFound: "Rattachement utilisateur introuvable.",
    rateLimited: "Une invitation a déjà été envoyée récemment. Patientez une minute avant de réessayer.",
} as const;

export function canResendOrganizationInvitation(status: OrganizationMemberStatus) {
    return status === ORGANIZATION_MEMBER_STATUS.invited;
}

export function isOrganizationInvitationResendCoolingDown(
    invitationSentAt: string | null,
    now = Date.now(),
) {
    if (!invitationSentAt) {
        return false;
    }

    const sentAt = Date.parse(invitationSentAt);

    return Number.isFinite(sentAt)
        && now - sentAt < ORGANIZATION_INVITATION_RESEND_COOLDOWN_MS;
}

export function getOrganizationInvitationResendSuccessMessage(email: string) {
    return `Une nouvelle invitation a été envoyée à ${email}.`;
}
