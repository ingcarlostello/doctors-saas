"use client";

import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/profile/useProfile";

export default function ProfilePage() {
  const {
    loading,
    error,
    subAccountSid,
    isUserLoading,
    hasSubaccount,
    handleCreateSubaccount,
  } = useProfile();

  return (
    <main className="p-8 flex flex-col gap-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <p className="text-sm text-muted-foreground">
        Crea una subcuenta de Twilio dentro de tu cuenta principal Doctors-saas.
        Esta subcuenta quedará asociada a tu usuario.
      </p>

      <Button
        onClick={handleCreateSubaccount}
        disabled={isUserLoading || loading || hasSubaccount}
      >
        {isUserLoading
          ? "Cargando perfil..."
          : hasSubaccount
            ? "cuenta activa"
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
    </main>
  );
}
