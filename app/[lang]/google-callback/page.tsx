"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useAction } from "convex/react";
const api = require("@/convex/_generated/api").api;
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as Locale) || "en";
  const exchangeCode = useAction(api.google_calendar.exchangeCode);
  const { isAuthenticated, isLoading } = useStoreUserEffect();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Esperar a que la autenticación y la sincronización del usuario se completen
    if (isLoading) return;

    if (!isAuthenticated) {
      setStatus("error");
      setErrorMessage(
        "No estás autenticado. Por favor inicia sesión nuevamente.",
      );
      return;
    }

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google Auth Error:", error);
      setStatus("error");
      setErrorMessage(error);
      toast.error("Error en la autenticación con Google");
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("No se recibió el código de autorización.");
      return;
    }

    const handleExchange = async () => {
      try {
        await exchangeCode({ code });
        setStatus("success");
        toast.success("Calendario conectado exitosamente");
        // Redirigir al calendario con el idioma
        router.push(`/${lang}/calendar`);
      } catch (err) {
        console.error("Exchange Error:", err);
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Error desconocido",
        );
        toast.error("Falló la conexión con Google Calendar");
      }
    };

    handleExchange();
  }, [searchParams, exchangeCode, router, lang, isAuthenticated, isLoading]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 text-center space-y-4">
        {status === "loading" && (
          <>
            <h2 className="text-2xl font-bold animate-pulse">Conectando...</h2>
            <p className="text-muted-foreground">
              Por favor espera un momento.
            </p>
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
            <p className="text-muted-foreground">
              No se pudo conectar el calendario.
            </p>
            {errorMessage && (
              <div className="mt-4 max-w-md p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600 break-words">
                {errorMessage}
              </div>
            )}
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
