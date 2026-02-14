
function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  const BufferImpl = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (BufferImpl) return new Uint8Array(BufferImpl.from(base64, "base64"));
  throw new Error("No base64 decoder available");
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  const BufferImpl = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (BufferImpl) return BufferImpl.from(bytes).toString("base64");
  throw new Error("No base64 encoder available");
}

async function importAesGcmKeyFromBase64(masterKeyBase64: string): Promise<CryptoKey> {
  const raw = base64ToBytes(masterKeyBase64);
  const rawBuffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
  return await crypto.subtle.importKey("raw", rawBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptWithAesGcm(text: string, masterKeyBase64: string) {
  const key = await importAesGcmKeyFromBase64(masterKeyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

async function decryptWithAesGcm(opts: { masterKeyBase64: string; ciphertextBase64: string; ivBase64: string }): Promise<string> {
  const key = await importAesGcmKeyFromBase64(opts.masterKeyBase64);
  const iv = base64ToBytes(opts.ivBase64);
  const ciphertext = base64ToBytes(opts.ciphertextBase64);
  const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, ciphertext as unknown as BufferSource);
  return new TextDecoder().decode(decryptedBuffer);
}

export {
  base64ToBytes,
  bytesToBase64,
  importAesGcmKeyFromBase64,
  encryptWithAesGcm,
  decryptWithAesGcm,
}
