import { webcrypto } from 'node:crypto';
import { generateId } from './id';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type TCryptoWithUuid = Crypto & { randomUUID?: () => string };

describe('generateId', () => {
    beforeAll(() => {
        if (typeof crypto === 'undefined') {
            (globalThis as { crypto?: unknown }).crypto = webcrypto;
        }
    });

    it('returns a valid unique UUID v4', () => {
        const first = generateId();
        const second = generateId();
        expect(first).toMatch(UUID_V4_REGEX);
        expect(second).toMatch(UUID_V4_REGEX);
        expect(first).not.toBe(second);
    });

    it('falls back to getRandomValues when crypto.randomUUID is unavailable', () => {
        const currentCrypto = crypto as TCryptoWithUuid;
        const descriptor = Object.getOwnPropertyDescriptor(currentCrypto, 'randomUUID');
        const getRandomValuesSpy = jest.spyOn(crypto, 'getRandomValues');

        try {
            Object.defineProperty(currentCrypto, 'randomUUID', { value: undefined, configurable: true });
            const id = generateId();
            expect(id).toMatch(UUID_V4_REGEX);
            expect(getRandomValuesSpy).toHaveBeenCalled();
        } finally {
            getRandomValuesSpy.mockRestore();
            if (descriptor !== undefined) {
                Object.defineProperty(currentCrypto, 'randomUUID', descriptor);
            }
        }
    });

    it('returns a UUID v4 even when crypto is entirely unavailable', () => {
        const originalCrypto = globalThis.crypto;
        (globalThis as { crypto?: unknown }).crypto = undefined;

        try {
            const id = generateId();
            expect(id).toMatch(UUID_V4_REGEX);
        } finally {
            (globalThis as { crypto?: unknown }).crypto = originalCrypto;
        }
    });
});
