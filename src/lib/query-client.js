import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: (failureCount, error) => {
				if (failureCount >= 4) return false;
				const msg = (error?.message || '').toLowerCase();
				const status = error?.status || error?.response?.status;
				// Sempre retenta em rate limit (429)
				if (status === 429 || msg.includes('rate limit')) return true;
				// Não retenta em outros erros 4xx
				if (status >= 400 && status < 500) return false;
				return true;
			},
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		},
	},
});