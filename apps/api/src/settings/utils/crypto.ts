import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts a plain text string using AES-256-CBC.
 * @param text The plain text string to encrypt.
 * @param secretKey The secret key from the environment.
 * @returns An IV and ciphertext combined string in format "iv:ciphertext".
 */
export function encrypt(text: string, secretKey: string): string {
  if (!text) return '';
  if (!secretKey) {
    throw new Error('Encryption key must be specified');
  }

  // Hash the key using sha256 to ensure it is exactly 32 bytes (256 bits)
  const key = crypto.createHash('sha256').update(String(secretKey)).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted string in the format "iv:ciphertext" using AES-256-CBC.
 * @param encryptedText The encrypted text in "iv:ciphertext" format.
 * @param secretKey The secret key from the environment.
 * @returns The decrypted plain text string.
 */
export function decrypt(encryptedText: string, secretKey: string): string {
  if (!encryptedText) return '';
  if (!secretKey) {
    throw new Error('Encryption key must be specified');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error(
      'Malformed encrypted text format. Expected "iv:ciphertext"',
    );
  }

  const iv = Buffer.from(parts.shift()!, 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const key = crypto.createHash('sha256').update(String(secretKey)).digest();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
