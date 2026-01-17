import { CHAT_ALLOWED_MIME_TYPES, CHAT_LIMITS } from "./chatConfig";

export function normalizeE164PhoneNumber(input: string): string {
  const trimmed = input.trim();
  const withoutWhatsApp = trimmed.startsWith("whatsapp:")
    ? trimmed.slice("whatsapp:".length)
    : trimmed;
  const digitsOnly = withoutWhatsApp.replace(/[^\d+]/g, "");
  if (!digitsOnly.startsWith("+")) {
    throw new Error("El número debe estar en formato E.164 (+...)");
  }
  return digitsOnly;
}

export function toTwilioWhatsAppAddress(e164: string): string {
  const normalized = normalizeE164PhoneNumber(e164);
  return `whatsapp:${normalized}`;
}

export function generateMessageId(): string {
  const randomUUID = (globalThis.crypto as unknown as { randomUUID?: () => string })
    ?.randomUUID;
  if (typeof randomUUID === "function") {
    return randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
}

export function previewFromContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 140)}…`;
}

export type AttachmentInput = {
  kind: "image" | "audio" | "video" | "file";
  url?: string;
  storageId?: string;
  mimeType?: string;
  sizeBytes: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
};

export function assertAttachmentsValid(attachments: AttachmentInput[] | undefined) {
  if (!attachments || attachments.length === 0) return;
  if (attachments.length > CHAT_LIMITS.MAX_ATTACHMENTS_COUNT) {
    throw new Error("Demasiados adjuntos");
  }
  let total = 0;
  for (const attachment of attachments) {
    total += attachment.sizeBytes;
    if (attachment.sizeBytes > CHAT_LIMITS.MAX_ATTACHMENT_BYTES_SINGLE) {
      throw new Error("Un adjunto excede el tamaño máximo permitido");
    }
    if (attachment.mimeType) {
      const allowed = (CHAT_ALLOWED_MIME_TYPES as readonly string[]).includes(
        attachment.mimeType,
      );
      if (!allowed) {
        throw new Error("Tipo de archivo no permitido");
      }
    }
  }
  if (total > CHAT_LIMITS.MAX_ATTACHMENT_BYTES_TOTAL) {
    throw new Error("Los adjuntos exceden el tamaño total permitido");
  }
}

export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}
