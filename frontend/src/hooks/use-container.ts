import { container } from 'tsyringe';

export function useInjection<T>(token: string | symbol): T {
    return container.resolve<T>(token);
}
