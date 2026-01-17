export const CHAT_LIMITS = {
  MAX_MESSAGE_CONTENT_LENGTH: 4000,
  MAX_ATTACHMENTS_COUNT: 5,
  MAX_ATTACHMENT_BYTES_SINGLE: 5 * 1024 * 1024,
  MAX_ATTACHMENT_BYTES_TOTAL: 10 * 1024 * 1024,
} as const;

export const CHAT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "video/mp4",
  "application/pdf",
] as const;

