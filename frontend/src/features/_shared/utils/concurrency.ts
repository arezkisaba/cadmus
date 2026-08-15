export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(fallback), timeoutMs);
        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            () => {
                clearTimeout(timer);
                resolve(fallback);
            }
        );
    });
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let offset = 0; offset < items.length; offset += limit) {
        const chunk = items.slice(offset, offset + limit);
        const chunkResults = await Promise.all(chunk.map((item, index) => mapper(item, offset + index)));
        results.push(...chunkResults);
    }
    return results;
}
