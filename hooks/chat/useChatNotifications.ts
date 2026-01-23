import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ChatNotificationItem = {
  id: string;
  unreadCount?: number;
  lastMessageAt?: number;
};

export type ChatNotificationAudioStatus = "idle" | "loading" | "ready" | "error";

export interface UseChatNotificationsOptions {
  items?: ChatNotificationItem[];
  activeItemId?: string | null;
  isEnabled?: boolean;
  isUserChatting?: boolean;
  audioSrc?: string;
  onNotify?: () => void;
}

export interface UseChatNotificationsResult {
  audioStatus: ChatNotificationAudioStatus;
  error: string | null;
  playNotification: () => Promise<void>;
}

/**
 * Gestiona notificaciones de chat con audio y detección de nuevos mensajes no leídos.
 * @param options Datos de conversaciones, configuración y callbacks opcionales.
 * @returns Estado del audio, errores y acción para reproducir la notificación.
 */
export function useChatNotifications(
  options: UseChatNotificationsOptions = {},
): UseChatNotificationsResult {
  const {
    items,
    activeItemId,
    isEnabled = true,
    isUserChatting = false,
    audioSrc = "/notificationChat.MP3",
    onNotify,
  } = options;

  const [audioStatus, setAudioStatus] = useState<ChatNotificationAudioStatus>(
    () => (isEnabled ? "loading" : "idle"),
  );
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitializedSnapshotRef = useRef(false);
  const snapshotRef = useRef(
    new Map<string, { unreadCount: number; lastMessageAt: number }>(),
  );

  useEffect(() => {
    if (!isEnabled) return;

    let audio: HTMLAudioElement | null = null;

    try {
      audio = new Audio(audioSrc);
      audio.preload = "auto";
      audio.addEventListener("loadstart", () => {
        setAudioStatus("loading");
        setError(null);
      });
      audio.addEventListener("canplaythrough", () => {
        setAudioStatus("ready");
        setError(null);
      });
      audio.addEventListener("error", () => {
        setAudioStatus("error");
        setError("No se pudo cargar el audio de notificación.");
      });
      audio.load();
      audioRef.current = audio;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo inicializar el audio.";
      setTimeout(() => {
        setAudioStatus("error");
        setError(message);
      }, 0);
    }

    return () => {
      hasInitializedSnapshotRef.current = false;
      snapshotRef.current = new Map();
      const current = audioRef.current;
      if (current) {
        current.pause();
        current.src = "";
      }
      audioRef.current = null;
    };
  }, [audioSrc, isEnabled]);

  useEffect(() => {
    const unlock = async () => {
      const audio = audioRef.current;
      if (!audio || audioStatus === "error") return;
      try {
        audio.muted = true;
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      } catch {}
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [audioStatus]);

  const playNotificationSilently = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioStatus === "error") return;
    try {
      if (audioStatus !== "ready") audio.load();
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
    } catch {}
  }, [audioStatus]);

  const playNotification = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioStatus === "error") return;
    try {
      if (audioStatus !== "ready") audio.load();
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
    } catch (err) {
      setAudioStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo reproducir el audio.",
      );
    }
  }, [audioStatus]);

  useEffect(() => {
    if (!isEnabled) return;
    if (!items) return;

    const nextSnapshot = new Map<
      string,
      { unreadCount: number; lastMessageAt: number }
    >();
    for (const item of items) {
      nextSnapshot.set(item.id, {
        unreadCount: item.unreadCount ?? 0,
        lastMessageAt: item.lastMessageAt ?? 0,
      });
    }

    if (!hasInitializedSnapshotRef.current) {
      hasInitializedSnapshotRef.current = true;
      snapshotRef.current = nextSnapshot;
      return;
    }

    if (isUserChatting) {
      snapshotRef.current = nextSnapshot;
      return;
    }

    let shouldNotify = false;
    for (const item of items) {
      if (activeItemId === item.id) continue;
      const prev = snapshotRef.current.get(item.id);
      if (!prev) continue;
      const nextUnread = item.unreadCount ?? 0;
      const nextLast = item.lastMessageAt ?? 0;
      if (nextUnread > prev.unreadCount && nextLast > prev.lastMessageAt) {
        shouldNotify = true;
        break;
      }
    }

    snapshotRef.current = nextSnapshot;

    if (shouldNotify) {
      void playNotificationSilently();
      onNotify?.();
    }
  }, [
    activeItemId,
    isEnabled,
    isUserChatting,
    items,
    onNotify,
    playNotificationSilently,
  ]);

  return useMemo(
    () => ({
      audioStatus: isEnabled ? audioStatus : "idle",
      error,
      playNotification,
    }),
    [audioStatus, error, isEnabled, playNotification],
  );
}
