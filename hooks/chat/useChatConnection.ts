import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ChatConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface UseChatConnectionOptions {
  autoConnect?: boolean;
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  onStatusChange?: (status: ChatConnectionStatus) => void;
}

export interface UseChatConnectionResult {
  status: ChatConnectionStatus;
  isOnline: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  retry: () => Promise<void>;
}

/**
 * Controla el estado de conexión del chat para APIs o WebSockets opcionales.
 * @param options Configuración del ciclo de vida y callbacks opcionales.
 * @returns Estado de conexión, conectividad de red y acciones de conexión.
 */
export function useChatConnection(
  options: UseChatConnectionOptions = {},
): UseChatConnectionResult {
  const { autoConnect = true, connect, disconnect, onStatusChange } = options;
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [status, setStatus] = useState<ChatConnectionStatus>(() => {
    if (connect) return "idle";
    return navigator.onLine ? "connected" : "disconnected";
  });
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const updateStatus = useCallback(
    (nextStatus: ChatConnectionStatus) => {
      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
    },
    [onStatusChange],
  );

  const connectToChat = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!navigator.onLine) {
      setIsOnline(false);
      setError("Sin conexión a internet.");
      updateStatus("disconnected");
      return;
    }

    if (!connect) {
      setError(null);
      updateStatus("connected");
      return;
    }

    try {
      inFlightRef.current = true;
      setError(null);
      updateStatus("connecting");
      await connect();
      updateStatus("connected");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudo conectar al chat.");
      }
      updateStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [connect, updateStatus]);

  const disconnectFromChat = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!disconnect) {
      updateStatus("disconnected");
      return;
    }

    try {
      inFlightRef.current = true;
      await disconnect();
      updateStatus("disconnected");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudo desconectar del chat.");
      }
      updateStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [disconnect, updateStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoConnect) void connectToChat();
    };
    const handleOffline = () => {
      setIsOnline(false);
      updateStatus("disconnected");
      if (disconnect) void disconnectFromChat();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autoConnect, connectToChat, disconnect, disconnectFromChat, updateStatus]);

  useEffect(() => {
    if (!autoConnect) return;
    if (!isOnline) return;
    void connectToChat();
  }, [autoConnect, connectToChat, isOnline]);

  const retry = useCallback(async () => {
    await connectToChat();
  }, [connectToChat]);

  return useMemo(
    () => ({
      status,
      isOnline,
      error,
      connect: connectToChat,
      disconnect: disconnectFromChat,
      retry,
    }),
    [status, isOnline, error, connectToChat, disconnectFromChat, retry],
  );
}
