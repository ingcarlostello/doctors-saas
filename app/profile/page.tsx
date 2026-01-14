"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/profile/useProfile";

type MainAccountNumber = {
  sid: string;
  phoneNumber: string;
  friendlyName?: string;
  capabilities?: {
    sms?: boolean;
    voice?: boolean;
    mms?: boolean;
    fax?: boolean;
  };
};

export default function ProfilePage() {
  const {
    loading,
    error,
    subAccountSid,
    isUserLoading,
    hasSubaccount,
    handleCreateSubaccount,
  } = useProfile();

  const listMainAccountNumbers = useAction(api.twilio.listMainAccountNumbers);
  const listCurrentUserSubaccountNumbers = useAction(
    api.twilio.listCurrentUserSubaccountNumbers,
  );
  const assignNumberToCurrentUserSubaccount = useAction(
    api.twilio.assignNumberToCurrentUserSubaccount,
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

      const result = await assignNumberToCurrentUserSubaccount({
        phoneNumberSid,
      });

      console.log("Número asignado correctamente:", result);

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

  const hasAnyAssigned = assignedNumbers.length > 0;
  const assignedSids = new Set(assignedNumbers.map((n) => n.sid));

  return (
    <main className="p-8 flex flex-col gap-6 max-w-xl mx-auto">
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Crea una subcuenta de Twilio dentro de tu cuenta principal
          Doctors-saas. Esta subcuenta quedará asociada a tu usuario.
        </p>

        <Button
          onClick={handleCreateSubaccount}
          disabled={isUserLoading || loading || hasSubaccount}
        >
          {isUserLoading
            ? "Cargando perfil..."
            : hasSubaccount
              ? "Cuenta activa"
              : loading
                ? "Creando subcuenta..."
                : "Crear subcuenta"}
        </Button>

        {subAccountSid && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Subcuenta creada correctamente. SID: {subAccountSid}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Error al crear la subcuenta: {error}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium">
            Números de la cuenta principal de Twilio
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleListMainNumbers}
            disabled={isLoadingNumbers || isLoadingAssigned}
          >
            {isLoadingNumbers || isLoadingAssigned
              ? "Cargando números..."
              : "Ver números"}
          </Button>
        </div>

        {numbersError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {numbersError}
          </p>
        )}

        {assignedError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {assignedError}
          </p>
        )}

        {assignError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {assignError}
          </p>
        )}

        {numbers.length > 0 && (
          <ul className="space-y-2 text-sm">
            {numbers.map((n) => {
              const isAssigned = assignedSids.has(n.sid);

              const disabled =
                !hasSubaccount ||
                assigningSid === n.sid ||
                isUserLoading ||
                (hasAnyAssigned && !isAssigned);

              const label = isAssigned
                ? "Número asignado"
                : assigningSid === n.sid
                  ? "Asignando..."
                  : "Asignar a mi subcuenta";

              return (
                <li
                  key={n.sid}
                  className="border rounded-md px-3 py-2 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {n.phoneNumber}{" "}
                        {n.friendlyName ? `· ${n.friendlyName}` : null}
                      </span>
                      <span className="text-xs text-muted-foreground break-all">
                        SID: {n.sid}
                      </span>
                      {n.capabilities && (
                        <span className="text-xs text-muted-foreground">
                          {[
                            n.capabilities.voice ? "voz" : null,
                            n.capabilities.sms ? "sms" : null,
                            n.capabilities.mms ? "mms" : null,
                            n.capabilities.fax ? "fax" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAssignNumber(n.sid)}
                      disabled={disabled}
                    >
                      {label}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!isLoadingNumbers && !numbersError && numbers.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Pulsa &quot;Ver números&quot; para listar los números activos de tu
            cuenta principal de Twilio.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium">
            Números asignados a tu subcuenta
          </h2>
        </div>

        {isLoadingAssigned && (
          <p className="text-sm text-muted-foreground">
            Cargando números asignados...
          </p>
        )}

        {!isLoadingAssigned &&
          !assignedError &&
          assignedNumbers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aún no tienes ningún número asignado a tu subcuenta.
            </p>
          )}

        {assignedError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {assignedError}
          </p>
        )}

        {assignedNumbers.length > 0 && (
          <ul className="space-y-2 text-sm">
            {assignedNumbers.map((n) => (
              <li
                key={n.sid}
                className="border rounded-md px-3 py-2 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">
                      {n.phoneNumber}{" "}
                      {n.friendlyName ? `· ${n.friendlyName}` : null}
                    </span>
                    <span className="text-xs text-muted-foreground break-all">
                      SID: {n.sid}
                    </span>
                    {n.capabilities && (
                      <span className="text-xs text-muted-foreground">
                        {[
                          n.capabilities.voice ? "voz" : null,
                          n.capabilities.sms ? "sms" : null,
                          n.capabilities.mms ? "mms" : null,
                          n.capabilities.fax ? "fax" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </div>

                  <Button size="sm" variant="secondary" disabled>
                    Número asignado
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
