"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/profile/useProfile";
import { useProfileTwilioManagement } from "@/hooks/profile/useProfileTwilioManagement";
import { useAction } from "convex/react";
const api = require("@/convex/_generated/api").api;
import { useState } from "react";

export default function ProfilePage() {
    const {
        loading,
        error,
        subAccountSid,
        isUserLoading,
        hasSubaccount,
        handleCreateSubaccount,
    } = useProfile();

    const {
        numbers,
        isLoadingNumbers,
        numbersError,
        assigningSid,
        assignError,
        assignedNumbers,
        isLoadingAssigned,
        assignedError,
        subaccountAuthToken,
        setSubaccountAuthToken,
        isSavingAuthToken,
        authTokenError,
        authTokenSuccess,
        handleListMainNumbers,
        handleAssignNumber,
        handleAssignAuthToken,
        hasAnyAssigned,
        assignedSids,
    } = useProfileTwilioManagement({ hasSubaccount });

    const listTemplates = useAction(api.twilio.listWhatsAppTemplates);
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [templatesError, setTemplatesError] = useState<string | null>(null);

    const handleListTemplates = async () => {
        setIsLoadingTemplates(true);
        setTemplatesError(null);
        try {
            const result = await listTemplates({});
            console.log("WhatsApp templates:", result);
            setTemplates(result);
        } catch (err: any) {
            setTemplatesError(err.message || "Error al cargar templates");
            console.error(err);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

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
                <h2 className="text-lg font-medium">Token de subcuenta (Twilio)</h2>
                <p className="text-sm text-muted-foreground">
                    Pega el Auth Token de la subcuenta para validar webhooks de Twilio.
                </p>

                <div className="flex items-center gap-2">
                    <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Auth Token de la subcuenta"
                        value={subaccountAuthToken}
                        onChange={(e) => setSubaccountAuthToken(e.target.value)}
                        disabled={isSavingAuthToken || isUserLoading || !hasSubaccount}
                    />
                    <Button
                        onClick={handleAssignAuthToken}
                        disabled={isSavingAuthToken || isUserLoading || !hasSubaccount}
                    >
                        {isSavingAuthToken ? "Guardando..." : "Asignar token"}
                    </Button>
                </div>

                {authTokenError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {authTokenError}
                    </p>
                )}

                {authTokenSuccess && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                        {authTokenSuccess}
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

            <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-medium">Templates de WhatsApp</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleListTemplates}
                        disabled={isLoadingTemplates}
                    >
                        {isLoadingTemplates ? "Cargando..." : "Ver templates"}
                    </Button>
                </div>

                {templatesError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {templatesError}
                    </p>
                )}

                {templates.length > 0 && (
                    <div className="grid gap-3">
                        {templates.map((t) => (
                            <div
                                key={t.sid}
                                className="border rounded-md px-3 py-2 flex flex-col gap-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{t.friendlyName}</span>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                        {t.language}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground break-all">
                                    SID: {t.sid}
                                </div>
                                <div className="flex gap-2 text-xs">
                                    {Object.keys(t.types || {}).map((type) => (
                                        <span key={type} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                                            {type.split('/').pop()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoadingTemplates && !templatesError && templates.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No hay templates cargados.
                    </p>
                )}
            </section>
        </main>
    );
}
