import { useEffect } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

type ScreenOption = {
  id: string;
  label: string;
};

const SCREEN_OPTIONS: ScreenOption[] = [
  { id: 'login', label: 'Login' },
  { id: 'home', label: 'Home' },
  { id: 'add-device', label: 'Add Device' },
  { id: 'account', label: 'Account' },
  { id: 'camera-live', label: 'Camera Live' },
  { id: 'camera-playback', label: 'Playback' },
  { id: 'camera-settings', label: 'Camera Settings' },
  { id: 'camera-share', label: 'Share Device' },
];

function currentCameraId(pathname: string | null) {
  const match = pathname?.match(/^\/camera\/([^/]+)/);
  return match?.[1] ?? 'preview';
}

function screenPath(screenId: string, pathname: string | null) {
  const cameraId = currentCameraId(pathname);
  switch (screenId) {
    case 'login':
      return '/login';
    case 'home':
      return '/home';
    case 'add-device':
      return '/add-device';
    case 'account':
      return '/account';
    case 'camera-live':
      return `/camera/${cameraId}/live`;
    case 'camera-playback':
      return `/camera/${cameraId}/playback`;
    case 'camera-settings':
      return `/camera/${cameraId}/settings`;
    case 'camera-share':
      return `/camera/${cameraId}/share`;
    default:
      return null;
  }
}

function postToHost(message: Record<string, unknown>) {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage(message, '*');
}

function elementLabel(element: Element) {
  const ariaLabel = element.getAttribute('aria-label');
  const testId = element.getAttribute('data-testid');
  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  return ariaLabel || testId || text?.slice(0, 60) || element.tagName.toLowerCase();
}

function elementId(element: Element) {
  return (
    element.getAttribute('data-testid') ||
    element.getAttribute('aria-label') ||
    element.id ||
    element.tagName.toLowerCase()
  );
}

function editableFieldsFor(element: Element) {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');
  const fields = ['style.color', 'style.backgroundColor', 'style.fontSize', 'style.spacing'];
  if (tagName === 'input' || tagName === 'textarea') fields.unshift('placeholder', 'value');
  if (role === 'button' || tagName === 'button') fields.unshift('text', 'button.label');
  if (element.textContent?.trim()) fields.unshift('text');
  return Array.from(new Set(fields));
}

export function IotekPreviewBridge() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    postToHost({ type: 'iotek:screens', screens: SCREEN_OPTIONS });

    let selectionMode = false;

    function handleHostMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      const type = typeof data.type === 'string' ? data.type : '';
      if (type === 'iotek:getScreens') {
        postToHost({ type: 'iotek:screens', screens: SCREEN_OPTIONS });
        return;
      }
      if (type === 'iotek:navigate' && typeof data.screenId === 'string') {
        const nextPath = screenPath(data.screenId, pathname);
        if (nextPath) router.replace(nextPath as never);
        return;
      }
      if (type === 'iotek:setSelectionMode') {
        selectionMode = Boolean(data.enabled);
        document.documentElement.dataset.iotekSelecting = selectionMode ? 'true' : 'false';
      }
    }

    function handleSelectClick(event: MouseEvent) {
      if (!selectionMode) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const selected = target.closest('[data-testid], [aria-label], button, input, textarea, a, [role="button"], div, span');
      if (!selected) return;
      event.preventDefault();
      event.stopPropagation();
      selectionMode = false;
      document.documentElement.dataset.iotekSelecting = 'false';
      postToHost({
        type: 'iotek:elementSelected',
        selection: {
          elementId: elementId(selected),
          label: elementLabel(selected),
          screen: pathname ?? undefined,
          description: `${selected.tagName.toLowerCase()} on ${pathname ?? 'current screen'}`,
          editableFields: editableFieldsFor(selected),
        },
      });
    }

    window.addEventListener('message', handleHostMessage);
    document.addEventListener('click', handleSelectClick, true);
    return () => {
      window.removeEventListener('message', handleHostMessage);
      document.removeEventListener('click', handleSelectClick, true);
      delete document.documentElement.dataset.iotekSelecting;
    };
  }, [pathname, router]);

  return null;
}
