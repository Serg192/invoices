import * as crypto from 'crypto';

const algorithm = 'aes-192-cbc';
const secretKey = crypto.scryptSync(
  process.env.MESSENGER_ENCRYPT_KEY,
  'unique',
  24,
);

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return encrypted.toString('hex') + iv.toString('hex');
};

export const decrypt = (hash: string): string => {
  try {
    const decipher = crypto.createDecipheriv(
      algorithm,
      secretKey,
      Buffer.from(hash.slice(-32), 'hex'),
    );

    const decrpyted = Buffer.concat([
      decipher.update(Buffer.from(hash.slice(0, -32), 'hex')),
      decipher.final(),
    ]);

    return decrpyted.toString();
  } catch (e) {
    return hash;
  }
};
