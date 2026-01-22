import { useCallback, useMemo, useReducer, useState } from "react";

export type ChatMessageId = string;

export interface UseChatMessagesOptions<TMessage extends { id: ChatMessageId }> {
  initialMessages?: TMessage[];
  loadMessages?: () => Promise<TMessage[]>;
}

export interface UseChatMessagesResult<TMessage extends { id: ChatMessageId }> {
  messages: TMessage[];
  messagesById: Map<ChatMessageId, TMessage>;
  isLoading: boolean;
  error: string | null;
  setMessages: (messages: TMessage[]) => void;
  addMessage: (message: TMessage) => void;
  addMessages: (messages: TMessage[]) => void;
  updateMessage: (
    id: ChatMessageId,
    updater: (message: TMessage) => TMessage,
  ) => void;
  removeMessage: (id: ChatMessageId) => void;
  clearMessages: () => void;
  reloadMessages: () => Promise<void>;
}

type MessageAction<TMessage extends { id: ChatMessageId }> =
  | { type: "set"; messages: TMessage[] }
  | { type: "add"; message: TMessage }
  | { type: "addMany"; messages: TMessage[] }
  | {
      type: "update";
      id: ChatMessageId;
      updater: (message: TMessage) => TMessage;
    }
  | { type: "remove"; id: ChatMessageId }
  | { type: "clear" };

function messagesReducer<TMessage extends { id: ChatMessageId }>(
  state: TMessage[],
  action: MessageAction<TMessage>,
): TMessage[] {
  switch (action.type) {
    case "set":
      return [...action.messages];
    case "add":
      return [...state, action.message];
    case "addMany":
      return [...state, ...action.messages];
    case "update": {
      let didUpdate = false;
      const next = state.map((message) => {
        if (message.id !== action.id) return message;
        didUpdate = true;
        return action.updater(message);
      });
      return didUpdate ? next : state;
    }
    case "remove": {
      const next = state.filter((message) => message.id !== action.id);
      return next.length === state.length ? state : next;
    }
    case "clear":
      return [];
    default:
      return state;
  }
}

/**
 * Administra una colección de mensajes con utilidades para cargar, mutar y consultar.
 * @param options Configuración inicial y función de carga remota opcional.
 * @returns Estado de mensajes, mapa de acceso rápido y acciones de mutación.
 */
export function useChatMessages<TMessage extends { id: ChatMessageId }>(
  options: UseChatMessagesOptions<TMessage> = {},
): UseChatMessagesResult<TMessage> {
  const { initialMessages = [], loadMessages } = options;
  const [messages, dispatch] = useReducer(messagesReducer<TMessage>, [
    ...initialMessages,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  const setMessages = useCallback((nextMessages: TMessage[]) => {
    dispatch({ type: "set", messages: nextMessages });
  }, []);

  const addMessage = useCallback((message: TMessage) => {
    dispatch({ type: "add", message });
  }, []);

  const addMessages = useCallback((nextMessages: TMessage[]) => {
    dispatch({ type: "addMany", messages: nextMessages });
  }, []);

  const updateMessage = useCallback(
    (id: ChatMessageId, updater: (message: TMessage) => TMessage) => {
      dispatch({ type: "update", id, updater });
    },
    [],
  );

  const removeMessage = useCallback((id: ChatMessageId) => {
    dispatch({ type: "remove", id });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const reloadMessages = useCallback(async () => {
    if (!loadMessages) {
      setError("No se configuró un cargador de mensajes.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const nextMessages = await loadMessages();
      dispatch({ type: "set", messages: nextMessages });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudieron cargar los mensajes.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages]);

  return {
    messages,
    messagesById,
    isLoading,
    error,
    setMessages,
    addMessage,
    addMessages,
    updateMessage,
    removeMessage,
    clearMessages,
    reloadMessages,
  };
}
