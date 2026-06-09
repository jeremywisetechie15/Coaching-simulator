"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Play, ExternalLink, Video, CheckCircle, RotateCcw, ChevronDown, ChevronUp, Pencil } from "lucide-react";

interface HeygenTestClientProps {
    systemInstructions: string;
    scenarioTitle: string;
    coachName: string;
}

type Status = "idle" | "loading" | "ready" | "error";

export default function HeygenTestClient({
    systemInstructions,
    scenarioTitle,
    coachName,
}: HeygenTestClientProps) {
    const [status, setStatus] = useState<Status>("idle");
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editablePrompt, setEditablePrompt] = useState(systemInstructions);
    const [isPromptExpanded, setIsPromptExpanded] = useState(false);

    const isPromptModified = editablePrompt !== systemInstructions;

    const startSession = async () => {
        setStatus("loading");
        setError(null);

        try {
            const res = await fetch("/api/heygen-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstructions: editablePrompt,
                    scenarioTitle,
                }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || "Failed to create LiveAvatar session");
            }

            setEmbedUrl(data.embedUrl);
            setStatus("ready");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setStatus("error");
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
            fontFamily: "'Inter', system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
        }}>
            {/* Header badge */}
            <div style={{
                position: "fixed",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "100px",
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backdropFilter: "blur(12px)",
                zIndex: 10,
            }}>
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#a78bfa",
                    boxShadow: "0 0 8px #a78bfa",
                }} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: 500 }}>
                    Test LiveAvatar
                </span>
            </div>

            {/* Main card */}
            <div style={{
                width: "100%",
                maxWidth: "900px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                backdropFilter: "blur(24px)",
            }}>
                {/* Top bar */}
                <div style={{
                    padding: "20px 28px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(255,255,255,0.02)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Video style={{ color: "white", width: 20, height: 20 }} />
                        </div>
                        <div>
                            <p style={{ color: "white", fontWeight: 600, fontSize: "15px", margin: 0 }}>
                                {coachName}
                            </p>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>
                                {scenarioTitle}
                            </p>
                        </div>
                    </div>
                    <div style={{
                        background: "rgba(167, 139, 250, 0.1)",
                        border: "1px solid rgba(167, 139, 250, 0.2)",
                        borderRadius: "8px",
                        padding: "4px 12px",
                        color: "#a78bfa",
                        fontSize: "12px",
                        fontWeight: 500,
                    }}>
                        🧪 Mode Test
                    </div>
                </div>

                {/* Content area */}
                <div style={{ padding: "32px 28px" }}>

                    {/* IDLE STATE */}
                    {status === "idle" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px" }}>
                            {/* Info cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", width: "100%" }}>
                                {[
                                    { label: "LLM", value: "GPT-4o Mini", color: "#10b981" },
                                    { label: "Avatar", value: "LiveAvatar", color: "#a78bfa" },
                                    { label: "Mode", value: "Sandbox", color: "#f59e0b" },
                                ].map(item => (
                                    <div key={item.label} style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                        borderRadius: "12px",
                                        padding: "16px",
                                        textAlign: "center",
                                    }}>
                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
                                            {item.label}
                                        </p>
                                        <p style={{ color: item.color, fontWeight: 600, fontSize: "14px", margin: 0 }}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Editable Prompt */}
                            <div style={{
                                width: "100%",
                                background: "rgba(0,0,0,0.3)",
                                border: isPromptModified
                                    ? "1px solid rgba(251, 191, 36, 0.4)"
                                    : "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "12px",
                                padding: "16px",
                                transition: "border-color 0.3s",
                            }}>
                                {/* Header row */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "10px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Pencil style={{ color: "rgba(255,255,255,0.4)", width: 12, height: 12 }} />
                                        <p style={{
                                            color: "rgba(255,255,255,0.4)",
                                            fontSize: "11px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            margin: 0,
                                        }}>
                                            Prompt système {isPromptModified ? "(modifié)" : ""}
                                        </p>
                                        {isPromptModified && (
                                            <span style={{
                                                background: "rgba(251,191,36,0.15)",
                                                border: "1px solid rgba(251,191,36,0.3)",
                                                borderRadius: "6px",
                                                padding: "2px 8px",
                                                color: "#fbbf24",
                                                fontSize: "10px",
                                                fontWeight: 600,
                                            }}>
                                                MODIFIÉ
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        {isPromptModified && (
                                            <button
                                                onClick={() => setEditablePrompt(systemInstructions)}
                                                style={{
                                                    background: "rgba(255,255,255,0.06)",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: "6px",
                                                    padding: "4px 10px",
                                                    color: "rgba(255,255,255,0.5)",
                                                    fontSize: "11px",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    transition: "all 0.2s",
                                                }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                                                }}
                                            >
                                                <RotateCcw style={{ width: 10, height: 10 }} />
                                                Reset
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                                            style={{
                                                background: "rgba(255,255,255,0.06)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "6px",
                                                padding: "4px 10px",
                                                color: "rgba(255,255,255,0.5)",
                                                fontSize: "11px",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                                            }}
                                        >
                                            {isPromptExpanded ? (
                                                <><ChevronUp style={{ width: 10, height: 10 }} /> Réduire</>
                                            ) : (
                                                <><ChevronDown style={{ width: 10, height: 10 }} /> Voir tout</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Prompt content */}
                                {isPromptExpanded ? (
                                    <textarea
                                        value={editablePrompt}
                                        onChange={e => setEditablePrompt(e.target.value)}
                                        style={{
                                            width: "100%",
                                            minHeight: "200px",
                                            maxHeight: "400px",
                                            background: "rgba(0,0,0,0.3)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "8px",
                                            padding: "12px",
                                            color: "rgba(255,255,255,0.8)",
                                            fontSize: "13px",
                                            lineHeight: 1.6,
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                            resize: "vertical",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                        onFocus={e => {
                                            e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)";
                                        }}
                                        onBlur={e => {
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                        }}
                                    />
                                ) : (
                                    <p
                                        style={{
                                            color: "rgba(255,255,255,0.6)",
                                            fontSize: "13px",
                                            lineHeight: 1.6,
                                            margin: 0,
                                            maxHeight: "80px",
                                            overflow: "hidden",
                                            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent)",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => setIsPromptExpanded(true)}
                                    >
                                        {editablePrompt.slice(0, 280)}...
                                    </p>
                                )}

                                {/* Character count */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginTop: "8px",
                                }}>
                                    <span style={{
                                        color: editablePrompt.length > 3000
                                            ? "#ef4444"
                                            : "rgba(255,255,255,0.25)",
                                        fontSize: "11px",
                                        fontFamily: "monospace",
                                    }}>
                                        {editablePrompt.length} caractères
                                    </span>
                                </div>
                            </div>

                            {/* Start button */}
                            <button
                                onClick={startSession}
                                style={{
                                    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                                    border: "none",
                                    borderRadius: "14px",
                                    padding: "16px 40px",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "15px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    boxShadow: "0 8px 24px rgba(124, 58, 237, 0.4)",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => {
                                    (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
                                    (e.target as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(124, 58, 237, 0.5)";
                                }}
                                onMouseLeave={e => {
                                    (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                                    (e.target as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(124, 58, 237, 0.4)";
                                }}
                            >
                                <Play style={{ width: 18, height: 18 }} />
                                Lancer l&apos;avatar LiveAvatar
                            </button>

                            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px", textAlign: "center", margin: 0 }}>
                                Mode sandbox activé — aucun crédit consommé
                            </p>
                        </div>
                    )}

                    {/* LOADING STATE */}
                    {status === "loading" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "40px" }}>
                            <div style={{ position: "relative" }}>
                                <div style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #7c3aed20, #a78bfa20)",
                                    border: "2px solid rgba(167,139,250,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <Loader2 style={{ color: "#a78bfa", width: 28, height: 28, animation: "spin 1s linear infinite" }} />
                                </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "white", fontWeight: 600, fontSize: "16px", margin: "0 0 8px" }}>
                                    Création de la session...
                                </p>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                                    Configuration du LLM + génération de l&apos;avatar
                                </p>
                            </div>
                            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {status === "error" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "32px" }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                background: "rgba(239,68,68,0.1)",
                                border: "2px solid rgba(239,68,68,0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <AlertCircle style={{ color: "#ef4444", width: 28, height: 28 }} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "#ef4444", fontWeight: 600, fontSize: "15px", margin: "0 0 8px" }}>
                                    Erreur de connexion
                                </p>
                                <p style={{
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: "13px",
                                    margin: "0 0 4px",
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    borderRadius: "8px",
                                    padding: "10px 16px",
                                    maxWidth: "500px",
                                    wordBreak: "break-word",
                                }}>
                                    {error}
                                </p>
                            </div>
                            <div style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "10px",
                                padding: "14px 18px",
                                maxWidth: "460px",
                            }}>
                                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0 0 6px", fontWeight: 600 }}>
                                    ⚠️ Vérifier dans .env :
                                </p>
                                <code style={{ color: "#a78bfa", fontSize: "12px", display: "block" }}>
                                    LIVEAVATAR_API_KEY=votre_clé_liveavatar
                                </code>
                                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: "6px 0 0" }}>
                                    Obtenir une clé sur app.liveavatar.com → Developers
                                </p>
                            </div>
                            <button
                                onClick={() => setStatus("idle")}
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "10px",
                                    padding: "10px 24px",
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* READY STATE — LiveAvatar iframe */}
                    {status === "ready" && embedUrl && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <CheckCircle style={{ color: "#10b981", width: 16, height: 16 }} />
                                    <span style={{ color: "#10b981", fontSize: "13px", fontWeight: 500 }}>
                                        Session active
                                    </span>
                                </div>
                                <a
                                    href={embedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: "rgba(255,255,255,0.4)",
                                        fontSize: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        textDecoration: "none",
                                    }}
                                >
                                    <ExternalLink style={{ width: 12, height: 12 }} />
                                    Ouvrir en plein écran
                                </a>
                            </div>
                            <div style={{
                                borderRadius: "16px",
                                overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.08)",
                                aspectRatio: "16/9",
                                width: "100%",
                                background: "#000",
                                boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                            }}>
                                <iframe
                                    src={embedUrl}
                                    allow="microphone; camera"
                                    title="LiveAvatar Coach"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: "none",
                                        display: "block",
                                    }}
                                />
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", textAlign: "center", margin: 0 }}>
                                LLM: GPT-4o Mini · Avatar: LiveAvatar Sandbox · Prompt: coach.after_training
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
