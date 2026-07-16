import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, mapDatabaseError } from "./errors";

export function jsonError(error: unknown) {
    error = mapDatabaseError(error);
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                code: "VALIDATION_ERROR",
                error: "Données invalides.",
                issues: error.issues,
            },
            { status: 400 }
        );
    }

    if (error instanceof AppError) {
        return NextResponse.json(
            {
                code: error.code,
                error: error.message,
            },
            { status: error.status }
        );
    }

    console.error(error);

    return NextResponse.json(
        {
            code: "INTERNAL_SERVER_ERROR",
            error: "Erreur interne.",
        },
        { status: 500 }
    );
}
