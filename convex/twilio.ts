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

// Crypto Helpers (duplicated from users.ts for now)
function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  const BufferImpl = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (BufferImpl) return new Uint8Array(BufferImpl.from(base64, "base64"));
  throw new Error("No hay decoder base64 disponible en este runtime");
}

async function importAesGcmKeyFromBase64(masterKeyBase64: string): Promise<CryptoKey> {
  const raw = base64ToBytes(masterKeyBase64);
  const rawBuffer = raw.buffer.slice(
    raw.byteOffset,
    raw.byteOffset + raw.byteLength,
  ) as ArrayBuffer;
  return await crypto.subtle.importKey(
    "raw",
    rawBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function decryptWithAesGcmBase64(opts: {
  masterKeyBase64: string;
  ciphertextBase64: string;
  ivBase64: string;
}): Promise<string> {
  const key = await importAesGcmKeyFromBase64(opts.masterKeyBase64);
  const iv = base64ToBytes(opts.ivBase64);
  const ciphertext = base64ToBytes(opts.ciphertextBase64);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource,
  );

  return new TextDecoder().decode(decryptedBuffer);
}

async function getSubaccountAuthHeader(ctx: any): Promise<string> {
  const currentUser = await ctx.runQuery(api.users.currentUser, {});
  if (!currentUser || !currentUser.twilioSubaccountSid) {
    throw new Error("El usuario no tiene subcuenta de Twilio configurada.");
  }

  if (
    !currentUser.twilioSubaccountAuthTokenCiphertext ||
    !currentUser.twilioSubaccountAuthTokenIv
  ) {
    // Fallback: Si no hay token guardado, intentamos usar el token maestro si es que la API lo permite, 
    // pero para Content API es mejor tener las credenciales de la subcuenta.
    // Por ahora lanzamos error.
    throw new Error("No se encontró el Auth Token de la subcuenta. Por favor re-configura tu subcuenta.");
  }

  const masterKey = ENV.TWILIO_SUBACCOUNT_AUTH_TOKEN_MASTER_KEY;
  if (!masterKey) {
    throw new Error("Server Error: Master Key not configured.");
  }

  const authToken = await decryptWithAesGcmBase64({
    masterKeyBase64: masterKey,
    ciphertextBase64: currentUser.twilioSubaccountAuthTokenCiphertext,
    ivBase64: currentUser.twilioSubaccountAuthTokenIv,
  });

  return `Basic ${btoa(`${currentUser.twilioSubaccountSid}:${authToken}`)}`;
}

function sanitizeTemplateName(name: string): string {
  const trimmed = name.trim();
  return trimmed.replace(/\s/g, "_");
}

function validateTemplateName(name: string): void {
  if (name.length === 0) {
    throw new Error("El nombre de la plantilla no puede estar vacío.");
  }
  if (/\s/.test(name)) {
    throw new Error("El nombre de la plantilla no puede contener espacios.");
  }
}

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

    // Check if user has subaccount configured
    const currentUser = await ctx.runQuery(api.users.currentUser, {});
    if (
      !currentUser ||
      !currentUser.twilioSubaccountSid ||
      !currentUser.twilioSubaccountAuthTokenCiphertext
    ) {
      console.log("Twilio not configured for user, returning empty templates list.");
      return [];
    }

    // Usar credenciales de la subcuenta del usuario
    const authHeader = await getSubaccountAuthHeader(ctx);

    // Usar el endpoint ContentAndApprovals para obtener estado de aprobación y categoría
    const url = `https://content.twilio.com/v1/ContentAndApprovals?PageSize=100`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error fetching Twilio templates:", errorText);
      throw new Error(`Error al obtener templates de Twilio: ${errorText}`);
    }

    const data = (await response.json()) as {
      contents?: Array<{
        sid: string;
        friendly_name: string;
        language: string;
        variables: Record<string, string>;
        types: Record<string, any>;
        date_created: string;
        approval_requests?: {
          status: string;
          category: string;
        };
      }>;
    };

    return (data.contents || []).map((t) => {
      // Extraer cuerpo del mensaje (prioridad: text > quick-reply > media)
      let body = "";
      let buttons: string[] = [];

      if (t.types?.["twilio/text"]) {
        body = t.types["twilio/text"].body;
      } else if (t.types?.["twilio/quick-reply"]) {
        body = t.types["twilio/quick-reply"].body;
        buttons = (t.types["twilio/quick-reply"].actions || []).map(
          (a: any) => a.title
        );
      } else if (t.types?.["twilio/media"]) {
         body = t.types["twilio/media"].body || "Media message";
      }

      return {
        sid: t.sid,
        friendlyName: t.friendly_name,
        language: t.language,
        variables: t.variables,
        types: t.types,
        createdAt: t.date_created,
        status: t.approval_requests?.status || "unsubmitted",
        category: t.approval_requests?.category || "UNCATEGORIZED",
        body,
        buttons,
      };
    });
  },
});

export const createContentTemplate = action({
  args: {
    friendly_name: v.string(),
    language: v.string(),
    variables: v.any(),
    types: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const authHeader = await getSubaccountAuthHeader(ctx);
    const friendlyName = sanitizeTemplateName(args.friendly_name);
    validateTemplateName(friendlyName);

    const url = `https://content.twilio.com/v1/Content`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendly_name: friendlyName,
        language: args.language,
        variables: args.variables,
        types: args.types,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error creando template en Twilio: ${errorText}`);
    }

    return await response.json();
  },
});

export const getTemplateStatus = action({
  args: {
    sid: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const authHeader = await getSubaccountAuthHeader(ctx);
    const url = `https://content.twilio.com/v1/Content/${args.sid}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error fetching template status: ${error}`);
    }

    return await response.json();
  }
});
