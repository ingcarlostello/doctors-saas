import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useProfile() {
  const createSubaccount = useAction(api.twilio.createTwilioSubaccount);
  const currentUser = useQuery(api.users.currentUser);
  const [loading, setLoading] = useState(false);
  const [subAccountSid, setSubAccountSid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUserLoading = currentUser === undefined;
  const hasSubaccount = Boolean(currentUser?.twilioSubaccountSid);

  const handleCreateSubaccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await createSubaccount();
      setSubAccountSid(result.subAccountSid);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ha ocurrido un error desconocido.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    subAccountSid,
    isUserLoading,
    hasSubaccount,
    handleCreateSubaccount,
  };
}
