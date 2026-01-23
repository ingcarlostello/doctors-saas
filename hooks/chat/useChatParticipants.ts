import { useCallback, useMemo, useReducer, useState } from "react";

export type ChatParticipantId = string;

export interface UseChatParticipantsOptions<
  TParticipant extends { id: ChatParticipantId },
> {
  initialParticipants?: TParticipant[];
  loadParticipants?: () => Promise<TParticipant[]>;
}

export interface UseChatParticipantsResult<
  TParticipant extends { id: ChatParticipantId },
> {
  participants: TParticipant[];
  participantsById: Map<ChatParticipantId, TParticipant>;
  isLoading: boolean;
  error: string | null;
  setParticipants: (participants: TParticipant[]) => void;
  addParticipant: (participant: TParticipant) => void;
  addParticipants: (participants: TParticipant[]) => void;
  updateParticipant: (
    id: ChatParticipantId,
    updater: (participant: TParticipant) => TParticipant,
  ) => void;
  removeParticipant: (id: ChatParticipantId) => void;
  clearParticipants: () => void;
  reloadParticipants: () => Promise<void>;
}

type ParticipantAction<TParticipant extends { id: ChatParticipantId }> =
  | { type: "set"; participants: TParticipant[] }
  | { type: "add"; participant: TParticipant }
  | { type: "addMany"; participants: TParticipant[] }
  | {
      type: "update";
      id: ChatParticipantId;
      updater: (participant: TParticipant) => TParticipant;
    }
  | { type: "remove"; id: ChatParticipantId }
  | { type: "clear" };

function participantsReducer<TParticipant extends { id: ChatParticipantId }>(
  state: TParticipant[],
  action: ParticipantAction<TParticipant>,
): TParticipant[] {
  switch (action.type) {
    case "set":
      return [...action.participants];
    case "add":
      return [...state, action.participant];
    case "addMany":
      return [...state, ...action.participants];
    case "update": {
      let didUpdate = false;
      const next = state.map((participant) => {
        if (participant.id !== action.id) return participant;
        didUpdate = true;
        return action.updater(participant);
      });
      return didUpdate ? next : state;
    }
    case "remove": {
      const next = state.filter((participant) => participant.id !== action.id);
      return next.length === state.length ? state : next;
    }
    case "clear":
      return [];
    default:
      return state;
  }
}

/**
 * Administra la lista de participantes de un chat con utilidades de carga y mutación.
 * @param options Configuración inicial y función de carga remota opcional.
 * @returns Estado de participantes, mapa de acceso rápido y acciones de mutación.
 */
export function useChatParticipants<
  TParticipant extends { id: ChatParticipantId },
>(
  options: UseChatParticipantsOptions<TParticipant> = {},
): UseChatParticipantsResult<TParticipant> {
  const { initialParticipants = [], loadParticipants } = options;
  const [participants, dispatch] = useReducer(
    participantsReducer<TParticipant>,
    [...initialParticipants],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantsById = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant])),
    [participants],
  );

  const setParticipants = useCallback((nextParticipants: TParticipant[]) => {
    dispatch({ type: "set", participants: nextParticipants });
  }, []);

  const addParticipant = useCallback((participant: TParticipant) => {
    dispatch({ type: "add", participant });
  }, []);

  const addParticipants = useCallback((nextParticipants: TParticipant[]) => {
    dispatch({ type: "addMany", participants: nextParticipants });
  }, []);

  const updateParticipant = useCallback(
    (id: ChatParticipantId, updater: (participant: TParticipant) => TParticipant) => {
      dispatch({ type: "update", id, updater });
    },
    [],
  );

  const removeParticipant = useCallback((id: ChatParticipantId) => {
    dispatch({ type: "remove", id });
  }, []);

  const clearParticipants = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const reloadParticipants = useCallback(async () => {
    if (!loadParticipants) {
      setError("No se configuró un cargador de participantes.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const nextParticipants = await loadParticipants();
      dispatch({ type: "set", participants: nextParticipants });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudieron cargar los participantes.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadParticipants]);

  return {
    participants,
    participantsById,
    isLoading,
    error,
    setParticipants,
    addParticipant,
    addParticipants,
    updateParticipant,
    removeParticipant,
    clearParticipants,
    reloadParticipants,
  };
}
