import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- HEADERS CORS ---
function setCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function OPTIONS() {
    return setCorsHeaders(NextResponse.json({}, { status: 200 }));
}

// Interface pour la notation
interface NotationResult {
    note_globale: number;
    feedback: string;
    points_forts: string[];
    points_amelioration: string[];
    details?: Record<string, { note: number; commentaire: string }>;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { transcript, session_id, pdf_filename } = body;

        if (!transcript) {
            return setCorsHeaders(
                NextResponse.json({ error: "Transcript manquant" }, { status: 400 })
            );
        }

        // Créer un client Supabase avec le service role pour accéder au storage
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return setCorsHeaders(
                NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. TÉLÉCHARGER LE PDF DEPUIS SUPABASE STORAGE
        const pdfPath = pdf_filename || "criteres_v1.pdf"; // Nom par défaut

        console.log("📊 Notation API - Fetching PDF from Supabase:", pdfPath);

        const { data: pdfData, error: pdfError } = await supabase
            .storage
            .from('notation_pdf')
            .download(pdfPath);

        if (pdfError || !pdfData) {
            console.error("❌ Erreur téléchargement PDF:", pdfError);
            return setCorsHeaders(
                NextResponse.json({
                    error: "PDF de notation non trouvé dans Supabase",
                    details: pdfError?.message
                }, { status: 404 })
            );
        }

        // Convertir le Blob en base64
        const arrayBuffer = await pdfData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Pdf = buffer.toString('base64');

        console.log("📊 PDF loaded, size:", buffer.length, "bytes");
        console.log("📊 Transcript length:", transcript.length, "characters");

        // 2. APPEL API OPENAI /v1/responses (supporte les PDF nativement)
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                instructions: `Tu es un expert en analyse d'appels commerciaux et de formation.

CONTEXTE :
- Tu reçois un document PDF contenant les critères de notation.
- Tu reçois un transcript d'un appel entre un UTILISATEUR (apprenant) et un PERSONA (client simulé joué par une IA).
- L'UTILISATEUR s'entraîne à la vente/négociation face au persona.

TA MISSION :
- Évalue UNIQUEMENT la performance de l'UTILISATEUR (pas le persona).
- Analyse comment l'utilisateur a géré la conversation selon les critères du PDF.
- Note sa capacité à : accrocher, découvrir les besoins, argumenter, conclure.

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans aucun texte avant ou après.
Le format attendu est :
{
  "note_globale": number (entre 0 et 100),
  "feedback": string (résumé de la performance de l'UTILISATEUR en 2-3 phrases),
  "points_forts": [string] (3-5 points positifs de l'utilisateur),
  "points_amelioration": [string] (3-5 axes d'amélioration pour l'utilisateur),
  "details": {
    "critere1": { "note": number, "commentaire": string },
    ...
  }
}`,
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_file",
                                filename: "criteres_notation.pdf",
                                file_data: `data:application/pdf;base64,${base64Pdf}`
                            },
                            {
                                type: "input_text",
                                text: `Voici la transcription de l'appel à analyser :

---
${transcript}
---

Analyse cet appel en te basant sur les critères du PDF ci-dessus et donne une notation détaillée en JSON.`
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Erreur OpenAI API:", errorData);
            return setCorsHeaders(
                NextResponse.json({
                    error: errorData.error?.message || "Erreur API OpenAI"
                }, { status: 500 })
            );
        }

        const data = await response.json();

        // 3. PARSING DE LA RÉPONSE (format /v1/responses)
        // L'API responses renvoie le contenu dans output[0].content[0].text
        let content = "";
        if (data.output && data.output[0]?.content) {
            // Format v1/responses
            const contentItem = data.output[0].content.find((c: { type: string }) => c.type === "output_text");
            content = contentItem?.text || "";
        } else if (data.choices) {
            // Fallback format chat/completions
            content = data.choices[0].message.content;
        }

        console.log("📊 OpenAI Response preview:", content.substring(0, 200));

        // Nettoyage du JSON
        const jsonStr = content.replace(/```json\s*|```\s*/g, '').trim();

        let resultJson: NotationResult;
        try {
            resultJson = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("❌ Erreur parsing JSON:", parseError);
            console.error("Raw content:", content);
            return setCorsHeaders(
                NextResponse.json({
                    error: "Format de réponse invalide",
                    raw_response: content
                }, { status: 500 })
            );
        }

        // 4. SAUVEGARDE EN DB SI SESSION_ID FOURNI
        if (session_id) {
            console.log("📊 Saving notation to session:", session_id);

            const { error: updateError } = await supabase
                .from('sessions')
                .update({ notation_json: resultJson })
                .eq('id', session_id);

            if (updateError) {
                console.error("❌ Erreur sauvegarde notation:", updateError);
            } else {
                console.log("✅ Notation saved to session");
            }
        }

        console.log("✅ Notation calculée:", resultJson.note_globale);

        // 5. RÉPONSE
        return setCorsHeaders(NextResponse.json({
            success: true,
            notation: resultJson,
            session_id: session_id || null
        }));

    } catch (error) {
        console.error("❌ Erreur Serveur:", error);
        return setCorsHeaders(
            NextResponse.json({
                error: "Erreur interne du serveur",
                details: error instanceof Error ? error.message : "Unknown error"
            }, { status: 500 })
        );
    }
}

// ROUTE GET - Récupérer la notation
// Params:
// - session_id: récupère la notation d'une session spécifique
// - scenario_id: récupère la notation de la dernière session de ce scénario
// - (aucun param): récupère la notation de la toute dernière session
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');
        const scenarioId = searchParams.get('scenario_id');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return setCorsHeaders(
                NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('sessions')
            .select('id, scenario_id, notation_json, created_at, status, scenarios(title)')
            .not('notation_json', 'is', null);

        // Cas 1: session_id fourni - récupérer cette session spécifique
        if (sessionId) {
            query = query.eq('id', sessionId);
        }
        // Cas 2: scenario_id fourni - récupérer la dernière session de ce scénario
        else if (scenarioId) {
            query = query
                .eq('scenario_id', scenarioId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1);
        }
        // Cas 3: Aucun param - récupérer la toute dernière session avec notation
        else {
            query = query
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1);
        }

        const { data: sessions, error } = await query;

        if (error) {
            console.error("❌ Erreur fetch notation:", error);
            return setCorsHeaders(
                NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
            );
        }

        if (!sessions || sessions.length === 0) {
            return setCorsHeaders(
                NextResponse.json({
                    error: "Aucune session avec notation trouvée",
                    session_id: sessionId,
                    scenario_id: scenarioId
                }, { status: 404 })
            );
        }

        const session = sessions[0];
        // scenarios est un objet nested, pas un array
        const scenario = session.scenarios as unknown as { title: string } | null;

        return setCorsHeaders(NextResponse.json({
            success: true,
            session_id: session.id,
            scenario_id: session.scenario_id,
            scenario_title: scenario?.title || null,
            created_at: session.created_at,
            notation: session.notation_json
        }));

    } catch (error) {
        console.error("❌ Erreur GET notation:", error);
        return setCorsHeaders(
            NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
        );
    }
}
