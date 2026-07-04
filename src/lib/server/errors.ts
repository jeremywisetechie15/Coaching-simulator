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
