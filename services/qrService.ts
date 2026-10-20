import { QRCodePayload, QRValidationResult } from '../types';

/**
 * Secret key used for cryptographic signature of access tokens.
 * In production this should come from secure environment variables or backend.
 */
const QR_SIGNING_SECRET = 'AML_SECURITY_PORTARIA_SECRET_KEY_v2';

/**
 * Lightweight, zero-dependency SHA-256 implementation in pure TypeScript
 * for universal browser and node cryptographic integrity.
 */
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (i = 0; i < ascii[lengthProperty]; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= code << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + (w[j] || 0)) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Creates an HMAC-like cryptographic signature for token payload
 */
export const signPayload = (payload: Omit<QRCodePayload, 'sig'>): string => {
  const content = `${payload.t}:${payload.id}:${payload.nm}:${payload.exp}:${payload.unt || ''}:${QR_SIGNING_SECRET}`;
  return sha256(content).substring(0, 16); // 16-char hex signature
};

/**
 * Generates a Base64 encoded JSON string representing the QR Data with cryptographic signature.
 * Uses unicode-safe encoding to support special characters.
 */
export const generateDynamicQRToken = (
  id: string,
  name: string,
  type: 'visitor' | 'resident' | 'employee' | 'provider' | 'dependent' | 'associate',
  validityHours: number,
  unit?: string
): string => {
  const now = Date.now();
  const expiresAt = now + (validityHours * 60 * 60 * 1000);

  const basePayload: Omit<QRCodePayload, 'sig'> = {
    t: type,
    id: id,
    nm: name,
    exp: expiresAt,
    unt: unit
  };

  const signature = signPayload(basePayload);
  const payload: QRCodePayload = {
    ...basePayload,
    sig: signature
  };

  const jsonString = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(jsonString)));
};

/**
 * Decodes and cryptographically validates a QR Token.
 * @param token The Base64 string scanned
 */
export const validateQRToken = (token: string): QRValidationResult => {
  try {
    const decodedString = decodeURIComponent(escape(atob(token)));
    const payload: QRCodePayload = JSON.parse(decodedString);

    const now = Date.now();

    if (!payload.exp || !payload.id || !payload.nm) {
      return { isValid: false, message: "Formato de QR Code inválido." };
    }

    // 1. Verify Expiration
    if (now > payload.exp) {
      return { 
        isValid: false, 
        message: "QR Code EXPIRADO.", 
        data: payload 
      };
    }

    // 2. Verify Cryptographic Signature
    if (!payload.sig) {
      return {
        isValid: false,
        message: "QR Code não assinado ou de versão legada não segura.",
        data: payload
      };
    }

    const { sig, ...basePayload } = payload;
    const expectedSig = signPayload(basePayload);

    if (sig !== expectedSig) {
      return {
        isValid: false,
        message: "ALERTA DE SEGURANÇA: Assinatura digital inválida! Tentativa de adulteração detectada.",
        data: payload
      };
    }

    return {
      isValid: true,
      message: "Acesso Autorizado (Assinatura Digital Verificada)",
      data: payload
    };

  } catch (error) {
    console.error("QR Decode Error", error);
    return { isValid: false, message: "Erro na leitura do código QR." };
  }
};
