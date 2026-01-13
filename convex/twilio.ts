import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { TWILIO_CONFIG } from "../lib/config";
import { ENV } from "../lib/env";

export const createTwilioSubaccount = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "Debes estar autenticado para crear una subcuenta de Twilio",
      );
    }

    const accountSid = ENV.TWILIO_ACCOUNT_SID;
    const authToken = ENV.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        "Las variables TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN no están configuradas",
      );
    }

    const friendlyName = identity.name!

    const url = `https://${accountSid}:${authToken}@${TWILIO_CONFIG.BASE_URL}${TWILIO_CONFIG.ENDPOINTS.ACCOUNTS}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        FriendlyName: `Dr-${friendlyName}-Subaccount`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`No se pudo crear la subcuenta de Twilio: ${errorText}`);
    }

    const data = await response.json();

    // Asegura que el usuario exista en la tabla `users`
    const userId = await ctx.runMutation(api.users.store, {});

    // Guarda el SID de la subcuenta en el usuario
    await ctx.runMutation(api.users.setTwilioSubaccountSid, {
      userId,
      twilioSubaccountSid: data.sid,
    });

    return {
      subAccountSid: data.sid as string,
      friendlyName: data.friendly_name as string | undefined,
    };
  },
});
