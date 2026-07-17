export const APP_TIME_ZONE = "Europe/Paris";

const longDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: APP_TIME_ZONE,
    year: "numeric",
});

const longDateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: APP_TIME_ZONE,
    year: "numeric",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: APP_TIME_ZONE,
    year: "2-digit",
});

export function formatShortDateTime(
    value: string | Date | null | undefined,
    fallback = "Non renseignée",
) {
    if (!value) return fallback;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    const parts = Object.fromEntries(
        shortDateTimeFormatter
            .formatToParts(date)
            .filter(({ type }) => type !== "literal")
            .map(({ type, value: partValue }) => [type, partValue]),
    );

    return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

export function formatLongDate(
    value: string | Date | null | undefined,
    fallback = "",
) {
    if (!value) return fallback;

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : longDateFormatter.format(date);
}

export function formatLongDateTime(
    value: string | Date | null | undefined,
    fallback = "Jamais connecté",
) {
    if (!value) return fallback;

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : longDateTimeFormatter.format(date);
}
