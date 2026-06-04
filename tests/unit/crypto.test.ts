import { describe, expect, it } from 'vitest';
import { decryptPayload, encryptText } from '../../src/lib/crypto';

describe('dataset encryption', () => {
  it('decrypts with the correct password', async () => {
    const payload = await encryptText('secret data', 'correct horse battery staple');
    await expect(decryptPayload(payload, 'correct horse battery staple')).resolves.toBe('secret data');
  });

  it('rejects an incorrect password', async () => {
    const payload = await encryptText('secret data', 'correct horse battery staple');
    await expect(decryptPayload(payload, 'wrong password')).rejects.toThrow();
  });
});
