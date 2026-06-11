import { useRouter } from 'expo-router';

/**
 * Returns a back handler that is safe when there is no navigation history
 * (e.g. a deep link or a hard page refresh). Without this, calling
 * `router.back()` with an empty stack throws "The action 'GO_BACK' was not
 * handled". Falls back to replacing with `fallback` (default `/home`).
 */
export function useSafeBack(fallback: string = '/home') {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  };
}
