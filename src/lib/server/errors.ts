export class AppError extends Error {
    readonly code: string;
    readonly status: number;

    constructor(message: string, status: number, code: string) {
        super(message);
        this.name = "AppError";
        this.status = status;
        this.code = code;
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Authentification requise.") {
        super(message, 401, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Action non autorisée.") {
        super(message, 403, "FORBIDDEN");
    }
}

export class ConflictError extends AppError {
    constructor(message = "Action impossible sur cette ressource.") {
        super(message, 409, "CONFLICT");
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Ressource introuvable.") {
        super(message, 404, "NOT_FOUND");
    }
}

interface DatabaseErrorLike {
    code?: string;
    message?: string;
}

const CONTENT_LIFECYCLE_DATABASE_ERROR_PREFIX = "CONTENT_LIFECYCLE_CONFLICT:";

export function mapDatabaseError(error: unknown): unknown {
    const databaseError = error as DatabaseErrorLike;
    if (
        databaseError?.code === "P0001"
        && databaseError.message?.startsWith(CONTENT_LIFECYCLE_DATABASE_ERROR_PREFIX)
    ) {
        return new ConflictError(
            databaseError.message.slice(CONTENT_LIFECYCLE_DATABASE_ERROR_PREFIX.length).trim(),
        );
    }

    return error;
}
