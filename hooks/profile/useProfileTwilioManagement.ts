import { useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
const api = require("@/convex/_generated/api").api;
import type { MainAccountNumber } from "@/chat/types/chat";

export function useProfileTwilioManagement({
  hasSubaccount,
}: {
  hasSubaccount: boolean;
}) {
  const listMainAccountNumbers = useAction(api.twilio.listMainAccountNumbers);
  const listCurrentUserSubaccountNumbers = useAction(
    api.twilio.listCurrentUserSubaccountNumbers,
  );
  const assignNumberToCurrentUserSubaccount = useAction(
    api.twilio.assignNumberToCurrentUserSubaccount,
  );
  const setCurrentUserTwilioSubaccountAuthToken = useAction(
    api.users.setCurrentUserTwilioSubaccountAuthToken,
  );

  const [numbers, setNumbers] = useState<MainAccountNumber[]>([]);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [numbersError, setNumbersError] = useState<string | null>(null);

  const [assigningSid, setAssigningSid] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [assignedNumbers, setAssignedNumbers] = useState<MainAccountNumber[]>(
    [],
  );
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);

  const [subaccountAuthToken, setSubaccountAuthToken] = useState("");
  const [isSavingAuthToken, setIsSavingAuthToken] = useState(false);
  const [authTokenError, setAuthTokenError] = useState<string | null>(null);
  const [authTokenSuccess, setAuthTokenSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAssigned = async () => {
      try {
        setIsLoadingAssigned(true);
        setAssignedError(null);
        const assignedResult = await listCurrentUserSubaccountNumbers({});
        if (!cancelled) {
          setAssignedNumbers(assignedResult as MainAccountNumber[]);
        }
      } catch (e) {
        if (!cancelled) {
          setAssignedError(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar los números asignados",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAssigned(false);
        }
      }
    };

    fetchAssigned();

    return () => {
      cancelled = true;
    };
  }, [listCurrentUserSubaccountNumbers]);

  const handleListMainNumbers = async () => {
    try {
      setIsLoadingNumbers(true);
      setNumbersError(null);
      setIsLoadingAssigned(true);
      setAssignedError(null);

      const [mainResult, assignedResult] = await Promise.all([
        listMainAccountNumbers({}),
        listCurrentUserSubaccountNumbers({}),
      ]);

      setNumbers(mainResult as MainAccountNumber[]);
      setAssignedNumbers(assignedResult as MainAccountNumber[]);
    } catch (e) {
      setNumbersError(
        e instanceof Error ? e.message : "No se pudieron cargar los números",
      );
      setAssignedError(
        e instanceof Error
          ? e.message
          : "No se pudieron cargar los números asignados",
      );
    } finally {
      setIsLoadingNumbers(false);
      setIsLoadingAssigned(false);
    }
  };

  const handleAssignNumber = async (phoneNumberSid: string) => {
    if (!hasSubaccount) {
      setAssignError("Primero debes crear una subcuenta de Twilio.");
      return;
    }

    try {
      setAssignError(null);
      setAssigningSid(phoneNumberSid);

      await assignNumberToCurrentUserSubaccount({
        phoneNumberSid,
      });

      const updatedAssigned = await listCurrentUserSubaccountNumbers({});
      setAssignedNumbers(updatedAssigned as MainAccountNumber[]);
    } catch (e) {
      setAssignError(
        e instanceof Error ? e.message : "No se pudo asignar el número",
      );
    } finally {
      setAssigningSid(null);
    }
  };

  const handleAssignAuthToken = async () => {
    if (!hasSubaccount) {
      setAuthTokenError("Primero debes crear una subcuenta de Twilio.");
      return;
    }

    const trimmed = subaccountAuthToken.trim();
    if (!trimmed) {
      setAuthTokenError("Pega el Auth Token de tu subcuenta.");
      return;
    }

    try {
      setAuthTokenError(null);
      setAuthTokenSuccess(null);
      setIsSavingAuthToken(true);

      await setCurrentUserTwilioSubaccountAuthToken({ authToken: trimmed });
      setSubaccountAuthToken("");
      setAuthTokenSuccess("Token guardado correctamente.");
    } catch (e) {
      setAuthTokenError(
        e instanceof Error ? e.message : "No se pudo guardar el token",
      );
    } finally {
      setIsSavingAuthToken(false);
    }
  };

  const hasAnyAssigned = assignedNumbers.length > 0;
  const assignedSids = useMemo(
    () => new Set(assignedNumbers.map((n) => n.sid)),
    [assignedNumbers],
  );

  return {
    assignedError,
    assignedNumbers,
    assignedSids,
    assignError,
    assigningSid,
    authTokenError,
    authTokenSuccess,
    handleAssignAuthToken,
    handleAssignNumber,
    handleListMainNumbers,
    hasAnyAssigned,
    isLoadingAssigned,
    isLoadingNumbers,
    isSavingAuthToken,
    numbers,
    numbersError,
    setSubaccountAuthToken,
    subaccountAuthToken,
  };
}
