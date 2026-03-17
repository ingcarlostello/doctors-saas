export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  const BufferImpl = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (BufferImpl) return BufferImpl.from(bytes).toString("base64");
  throw new Error("No hay encoder base64 disponible en este runtime");
}

export function base64ToBytes(base64: string): Uint8Array {
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

export async function importAesGcmKeyFromBase64(masterKeyBase64: string): Promise<CryptoKey> {
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

export async function encryptWithAesGcmBase64(opts: {
  masterKeyBase64: string;
  plaintext: string;
}): Promise<{ ciphertextBase64: string; ivBase64: string }> {
  const key = await importAesGcmKeyFromBase64(opts.masterKeyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(opts.plaintext),
  );
  return {
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertext)),
    ivBase64: bytesToBase64(iv),
  };
}

export async function decryptWithAesGcmBase64(opts: {
  masterKeyBase64: string;
  ciphertextBase64: string;
  ivBase64: string;
}): Promise<string> {
  const key = await importAesGcmKeyFromBase64(opts.masterKeyBase64);
  const ivBytes = base64ToBytes(opts.ivBase64);
  // Reconstruct correctly typed ArrayBuffer slices for subtle crypto
  const iv = ivBytes.buffer.slice(
    ivBytes.byteOffset,
    ivBytes.byteOffset + ivBytes.byteLength,
  ) as ArrayBuffer;
  
  const ciphertextBytes = base64ToBytes(opts.ciphertextBase64);
  const ciphertext = ciphertextBytes.buffer.slice(
    ciphertextBytes.byteOffset,
    ciphertextBytes.byteOffset + ciphertextBytes.byteLength,
  ) as ArrayBuffer;

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decryptedBuffer);
}

export async function computeHmacSha1Base64(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return bytesToBase64(new Uint8Array(signature));
}
