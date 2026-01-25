"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n";

export default function GoogleCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const lang = (params.lang as Locale) || "en";
    const exchangeCode = useAction(api.google_calendar.exchangeCode);
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            console.error("Google Auth Error:", error);
            setStatus("error");
            toast.error("Error en la autenticación con Google");
            return;
        }

        if (!code) {
            setStatus("error");
            return;
        }

        const handleExchange = async () => {
            try {
                await exchangeCode({ code });
                setStatus("success");
                toast.success("Calendario conectado exitosamente");
                // Redirect to calendar with locale
                router.push(`/${lang}/calendar`);
            } catch (err) {
                console.error("Exchange Error:", err);
                setStatus("error");
                toast.error("Falló la conexión con Google Calendar");
            }
        };

        handleExchange();
    }, [searchParams, exchangeCode, router, lang]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="p-8 text-center space-y-4">
                {status === "loading" && (
                    <>
                        <h2 className="text-2xl font-bold animate-pulse">Conectando...</h2>
                        <p className="text-muted-foreground">Por favor espera un momento.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <h2 className="text-2xl font-bold text-green-600">¡Conectado!</h2>
                        <p>Redirigiendo...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h2 className="text-2xl font-bold text-red-600">Error</h2>
                        <p className="text-muted-foreground">No se pudo conectar el calendario.</p>
                        <button
                            onClick={() => router.push(`/${lang}`)}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                        >
                            Volver al inicio
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
