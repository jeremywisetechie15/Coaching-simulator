"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Action serveur : déconnecte l'utilisateur courant puis redirige vers la page
 * d'authentification. Pensée pour être attachée à un `<form action={…}>`.
 */
export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth");
}
