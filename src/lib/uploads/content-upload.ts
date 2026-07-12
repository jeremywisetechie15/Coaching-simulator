// Existing method files are stored in the legacy notation bucket.
// The logical ownership is still carried by method_resources vs notation_method_files.
export const CONTENT_UPLOAD_BUCKET = "notation_pdf";
export const QUIZ_UPLOAD_BUCKET = "quizzes";
export const SCENARIO_RESOURCE_UPLOAD_BUCKET = "resource_scenarios";
export const SESSION_BACKGROUND_UPLOAD_BUCKET = "session-backgrounds";

export const CONTENT_RESOURCE_DELIVERY_TYPE = {
    file: "file",
    url: "url",
} as const;

export const CONTENT_RESOURCE_DELIVERY_TYPES = [
    CONTENT_RESOURCE_DELIVERY_TYPE.file,
    CONTENT_RESOURCE_DELIVERY_TYPE.url,
] as const;

export type ContentResourceDeliveryType = (typeof CONTENT_RESOURCE_DELIVERY_TYPES)[number];

export const CONTENT_RESOURCE_DELIVERY_OPTIONS = [
    { label: "Fichier", value: CONTENT_RESOURCE_DELIVERY_TYPE.file },
    { label: "URL", value: CONTENT_RESOURCE_DELIVERY_TYPE.url },
] as const;

export const MAX_CONTENT_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_SESSION_BACKGROUND_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024;

export const CONTENT_UPLOAD_RESOURCE_TYPES = ["document", "video", "audio", "image"] as const;

export type ContentUploadResourceType = (typeof CONTENT_UPLOAD_RESOURCE_TYPES)[number];

export const CONTENT_UPLOAD_PURPOSES = {
    contentAsset: "content_asset",
    methodDocument: "method_document",
    personaAvatar: "persona_avatar",
    quizAttachment: "quiz_attachment",
    scenarioResource: "scenario_resource",
    sessionBackground: "session_background",
} as const;

export type ContentUploadPurpose = (typeof CONTENT_UPLOAD_PURPOSES)[keyof typeof CONTENT_UPLOAD_PURPOSES];

interface MimeConfig {
    extension: string;
    resourceType: ContentUploadResourceType;
}

export const CONTENT_UPLOAD_MIME_TYPES = {
    "application/msword": { extension: "doc", resourceType: "document" },
    "application/pdf": { extension: "pdf", resourceType: "document" },
    "application/vnd.ms-excel": { extension: "xls", resourceType: "document" },
    "application/vnd.ms-powerpoint": { extension: "ppt", resourceType: "document" },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        extension: "pptx",
        resourceType: "document",
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        extension: "xlsx",
        resourceType: "document",
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        extension: "docx",
        resourceType: "document",
    },
    "audio/mpeg": { extension: "mp3", resourceType: "audio" },
    "audio/mp4": { extension: "m4a", resourceType: "audio" },
    "audio/ogg": { extension: "ogg", resourceType: "audio" },
    "audio/wav": { extension: "wav", resourceType: "audio" },
    "image/jpeg": { extension: "jpg", resourceType: "image" },
    "image/png": { extension: "png", resourceType: "image" },
    "image/webp": { extension: "webp", resourceType: "image" },
    "text/csv": { extension: "csv", resourceType: "document" },
    "text/markdown": { extension: "md", resourceType: "document" },
    "text/plain": { extension: "txt", resourceType: "document" },
    "text/x-markdown": { extension: "md", resourceType: "document" },
    "video/mp4": { extension: "mp4", resourceType: "video" },
    "video/quicktime": { extension: "mov", resourceType: "video" },
    "video/webm": { extension: "webm", resourceType: "video" },
} satisfies Record<string, MimeConfig>;

export const CONTENT_UPLOAD_ACCEPT = Object.keys(CONTENT_UPLOAD_MIME_TYPES).join(",");

const DOCUMENT_UPLOAD_MIME_TYPES = Object.entries(CONTENT_UPLOAD_MIME_TYPES)
    .filter(([, config]) => config.resourceType === "document")
    .map(([mimeType]) => mimeType);

export const DOCUMENT_UPLOAD_ACCEPT = DOCUMENT_UPLOAD_MIME_TYPES.join(",");

const QUIZ_ATTACHMENT_UPLOAD_MIME_TYPES = Object.entries(CONTENT_UPLOAD_MIME_TYPES)
    .filter(([, config]) => ["document", "image", "video", "audio"].includes(config.resourceType))
    .map(([mimeType]) => mimeType);

export const QUIZ_ATTACHMENT_UPLOAD_ACCEPT = QUIZ_ATTACHMENT_UPLOAD_MIME_TYPES.join(",");

const IMAGE_UPLOAD_MIME_TYPES = Object.entries(CONTENT_UPLOAD_MIME_TYPES)
    .filter(([, config]) => config.resourceType === "image")
    .map(([mimeType]) => mimeType);

export const IMAGE_UPLOAD_ACCEPT = IMAGE_UPLOAD_MIME_TYPES.join(",");

export interface ContentUploadFileLike {
    name: string;
    size: number;
    type: string;
}

export function getContentUploadAccept(purpose: ContentUploadPurpose = CONTENT_UPLOAD_PURPOSES.contentAsset) {
    if (purpose === CONTENT_UPLOAD_PURPOSES.methodDocument) return DOCUMENT_UPLOAD_ACCEPT;
    if (purpose === CONTENT_UPLOAD_PURPOSES.quizAttachment) return QUIZ_ATTACHMENT_UPLOAD_ACCEPT;
    if (
        purpose === CONTENT_UPLOAD_PURPOSES.personaAvatar ||
        purpose === CONTENT_UPLOAD_PURPOSES.sessionBackground
    ) return IMAGE_UPLOAD_ACCEPT;

    return CONTENT_UPLOAD_ACCEPT;
}

export function getContentUploadMimeConfig(mimeType: string) {
    return CONTENT_UPLOAD_MIME_TYPES[mimeType as keyof typeof CONTENT_UPLOAD_MIME_TYPES] ?? null;
}

export function inferContentUploadResourceType(mimeType: string): ContentUploadResourceType {
    return getContentUploadMimeConfig(mimeType)?.resourceType ?? "document";
}

export function validateContentUploadFile(
    file: ContentUploadFileLike,
    purpose: ContentUploadPurpose = CONTENT_UPLOAD_PURPOSES.contentAsset,
) {
    const mimeConfig = getContentUploadMimeConfig(file.type);

    if (!mimeConfig) {
        return "Format de fichier non supporté.";
    }

    if (purpose === CONTENT_UPLOAD_PURPOSES.methodDocument && mimeConfig.resourceType !== "document") {
        return "Les ressources complémentaires acceptent uniquement des documents.";
    }

    if (
        purpose === CONTENT_UPLOAD_PURPOSES.quizAttachment &&
        !["document", "image", "video", "audio"].includes(mimeConfig.resourceType)
    ) {
        return "Les pièces jointes de quiz acceptent uniquement des documents, images, vidéos ou audios.";
    }

    if (purpose === CONTENT_UPLOAD_PURPOSES.sessionBackground && mimeConfig.resourceType !== "image") {
        return "Le fond de session accepte uniquement une image JPG, PNG ou WebP.";
    }

    if (purpose === CONTENT_UPLOAD_PURPOSES.personaAvatar && mimeConfig.resourceType !== "image") {
        return "L'avatar du persona accepte uniquement une image JPG, PNG ou WebP.";
    }

    if (file.size <= 0) {
        return "Le fichier est vide.";
    }

    const isLimitedImage =
        purpose === CONTENT_UPLOAD_PURPOSES.personaAvatar ||
        purpose === CONTENT_UPLOAD_PURPOSES.sessionBackground;
    const maxSizeBytes = isLimitedImage
        ? MAX_SESSION_BACKGROUND_UPLOAD_SIZE_BYTES
        : (purpose === CONTENT_UPLOAD_PURPOSES.quizAttachment || purpose === CONTENT_UPLOAD_PURPOSES.scenarioResource) &&
            mimeConfig.resourceType === "video"
            ? MAX_VIDEO_UPLOAD_SIZE_BYTES
            : MAX_CONTENT_UPLOAD_SIZE_BYTES;

    if (file.size > maxSizeBytes) {
        return isLimitedImage
            ? purpose === CONTENT_UPLOAD_PURPOSES.personaAvatar
                ? "L'avatar du persona ne doit pas dépasser 10 Mo."
                : "L'image de fond ne doit pas dépasser 10 Mo."
            : mimeConfig.resourceType === "video" && maxSizeBytes === MAX_VIDEO_UPLOAD_SIZE_BYTES
            ? "La vidéo ne doit pas dépasser 250 Mo."
            : "Le fichier ne doit pas dépasser 25 Mo.";
    }

    return null;
}

export function sanitizeUploadFileName(fileName: string, mimeType: string) {
    const configuredExtension = getContentUploadMimeConfig(mimeType)?.extension ?? "bin";
    const trimmedName = fileName.trim();
    const extensionMatch = trimmedName.match(/\.([a-zA-Z0-9]{1,12})$/);
    const extension = (extensionMatch?.[1] ?? configuredExtension).toLowerCase();
    const baseName = trimmedName.replace(/\.[a-zA-Z0-9]{1,12}$/, "");
    const normalizedBaseName = baseName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

    return `${normalizedBaseName || "document"}.${extension}`;
}

export function getStoragePathFileName(path: string) {
    return path.split("/").filter(Boolean).pop() ?? "document";
}

export function formatUploadFileSize(sizeBytes: number | null | undefined) {
    if (!sizeBytes || sizeBytes <= 0) {
        return "";
    }

    if (sizeBytes < 1024 * 1024) {
        return `${Math.ceil(sizeBytes / 1024)} Ko`;
    }

    const megabytes = sizeBytes / (1024 * 1024);
    return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} Mo`;
}
