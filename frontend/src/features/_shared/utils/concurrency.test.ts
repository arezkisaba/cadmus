import { mapWithConcurrency, withTimeout } from './concurrency';

describe('withTimeout', () => {
    it('resolves with the value when the promise completes first', async () => {
        await expect(withTimeout(Promise.resolve('ok'), 1000, 'fallback')).resolves.toBe('ok');
    });

    it('resolves with the fallback when the promise times out', async () => {
        const slow = new Promise<string>((resolve) => {
            setTimeout(() => resolve('late'), 200);
        });
        await expect(withTimeout(slow, 30, 'fallback')).resolves.toBe('fallback');
    });

    it('resolves with the fallback when the promise rejects', async () => {
        await expect(withTimeout(Promise.reject(new Error('boom')), 1000, 'fallback')).resolves.toBe('fallback');
    });
});

describe('mapWithConcurrency', () => {
    it('maps all items and preserves order', async () => {
        const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => value * 2);
        expect(result).toEqual([2, 4, 6, 8]);
    });

    it('handles an empty input', async () => {
        const result = await mapWithConcurrency<number, number>([], 3, async (value) => value);
        expect(result).toEqual([]);
    });

    it('respects the concurrency limit', async () => {
        let active = 0;
        let maxActive = 0;
        const mapper = async (value: number): Promise<number> => {
            active += 1;
            maxActive = Math.max(maxActive, active);
            await new Promise((resolve) => setTimeout(resolve, 10));
            active -= 1;
            return value;
        };
        await mapWithConcurrency([1, 2, 3, 4, 5], 2, mapper);
        expect(maxActive).toBeLessThanOrEqual(2);
    });
});
