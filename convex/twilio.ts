import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { TWILIO_CONFIG } from "../lib/config";
import { ENV } from "../lib/env";
import type { TwilioIncomingPhoneNumber } from "../interfaces/convex/twilio";
import { v } from "convex/values";

type TwilioMappedPhoneNumber = {
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

type AssignNumberArgs = {
  phoneNumberSid: string;
};

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

    const friendlyName = identity.name!;

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

    const userId = await ctx.runMutation(api.users.store, {});

    await ctx.runMutation(api.users.setTwilioSubaccountSid, {
      userId,
      twilioSubaccountSid: data.sid,
    });

    return {
      subAccountSid: data.sid as string,
      friendlyName: (data.friendly_name as string) || undefined,
    };
  },
});

export const listMainAccountNumbers = action({
  args: {},
  handler: async () => {
    const accountSid = ENV.TWILIO_ACCOUNT_SID;
    const authToken = ENV.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        "Las variables TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN no están configuradas",
      );
    }

    const url = `https://${accountSid}:${authToken}@${TWILIO_CONFIG.BASE_URL}/Accounts/${accountSid}/IncomingPhoneNumbers.json`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `No se pudieron obtener los números de la cuenta principal: ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      incoming_phone_numbers?: TwilioIncomingPhoneNumber[];
    };

    return (data.incoming_phone_numbers ?? []).map((num) => ({
      sid: num.sid,
      phoneNumber: num.phone_number,
      friendlyName: num.friendly_name,
      capabilities: num.capabilities,
    }));
  },
});

export const assignNumberToCurrentUserSubaccount = action({
  args: {
    phoneNumberSid: v.string(), // SID tipo "PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  },
  handler: async (ctx, { phoneNumberSid }: AssignNumberArgs): Promise<TwilioMappedPhoneNumber> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "Debes estar autenticado para asignar un número de Twilio",
      );
    }

    const accountSid = ENV.TWILIO_ACCOUNT_SID;
    const authToken = ENV.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        "Las variables TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN no están configuradas",
      );
    }

    // Obtenemos el usuario actual desde Convex para acceder a su twilioSubaccountSid
    const currentUser = await ctx.runQuery(api.users.currentUser, {});
    if (!currentUser) {
      throw new Error("No se encontró el usuario en la base de datos");
    }

    if (!currentUser.twilioSubaccountSid) {
      throw new Error(
        "Este usuario aún no tiene una subcuenta de Twilio. Crea una antes de asignar un número.",
      );
    }

    // URL para actualizar el IncomingPhoneNumber en la cuenta principal
    // Equivalente a: client.incomingPhoneNumbers(PN...).update({ accountSid: subAccountSid })
    const url = `https://${accountSid}:${authToken}@${TWILIO_CONFIG.BASE_URL}/Accounts/${accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`;

    const body = new URLSearchParams({
      AccountSid: currentUser.twilioSubaccountSid, // Transferimos el número a la subcuenta del usuario
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `No se pudo asignar el número a la subcuenta del usuario: ${errorText}`,
      );
    }

    const data = await response.json();

    const result: TwilioMappedPhoneNumber = {
      sid: data.sid as string,
      phoneNumber: data.phone_number as string,
      friendlyName: (data.friendly_name as string) || undefined,
      capabilities: data.capabilities,
    };

    await ctx.runMutation(api.users.addAssignedNumberToCurrentUser, {
      phoneNumber: result.phoneNumber,
    });

    return result;
  },
});

export const listCurrentUserSubaccountNumbers = action({
  args: {},
  handler: async (ctx): Promise<TwilioMappedPhoneNumber[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "Debes estar autenticado para listar los números de Twilio",
      );
    }

    const accountSid = ENV.TWILIO_ACCOUNT_SID;
    const authToken = ENV.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        "Las variables TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN no están configuradas",
      );
    }

    const currentUser = await ctx.runQuery(api.users.currentUser, {});
    if (!currentUser || !currentUser.twilioSubaccountSid) {
      return [];
    }

    const url = `https://${accountSid}:${authToken}@${TWILIO_CONFIG.BASE_URL}/Accounts/${currentUser.twilioSubaccountSid}/IncomingPhoneNumbers.json`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `No se pudieron obtener los números de la subcuenta: ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      incoming_phone_numbers?: TwilioIncomingPhoneNumber[];
    };

    return (data.incoming_phone_numbers ?? []).map((num) => ({
      sid: num.sid,
      phoneNumber: num.phone_number,
      friendlyName: num.friendly_name,
      capabilities: num.capabilities,
    }));
  },
});

export const listWhatsAppTemplates = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Debes estar autenticado para listar los templates");
    }

    const accountSid = ENV.TWILIO_ACCOUNT_SID;
    const authToken = ENV.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        "Las variables TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN no están configuradas",
      );
    }

    const url = `https://content.twilio.com/v1/Content`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener templates de Twilio: ${errorText}`);
    }

    const data = (await response.json()) as {
      contents?: Array<{
        sid: string;
        friendly_name?: string;
        language?: string;
        variables?: unknown;
        types?: Record<string, unknown>;
      }>;
    };

    return (data.contents || []).map((t) => ({
      sid: t.sid,
      friendlyName: t.friendly_name,
      language: t.language,
      variables: t.variables,
      types: t.types,
    }));
  },
});
