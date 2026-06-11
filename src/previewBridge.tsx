import { useEffect } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

type ScreenOption = {
  id: string;
  label: string;
};

const SCREEN_OPTIONS: ScreenOption[] = [
  { id: 'welcome', label: 'Welcome' },
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
    case 'welcome':
      return '/welcome';
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

function elementRect(element: Element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    viewportWidth: window.innerWidth || document.documentElement.clientWidth || 393,
    viewportHeight: window.innerHeight || document.documentElement.clientHeight || 852,
  };
}

const BRIDGE_STYLE_ID = 'iotek-preview-bridge-style';
const HOVER_CLASS = 'iotek-select-hover';
const SELECTED_CLASS = 'iotek-select-selected';
const OVERLAY_ID = 'iotek-selection-overlay';
// Any visible element under the cursor is selectable — the feature is "click a
// div on the app, then tell the AI how to change it". closest() returns the
// innermost matching element (usually the one the user pointed at).
const SELECTABLE_SELECTOR =
  '[data-testid], [aria-label], button, input, textarea, a, [role="button"], div, span';

function ensureBridgeStyle() {
  if (typeof document === 'undefined' || document.getElementById(BRIDGE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = BRIDGE_STYLE_ID;
  style.textContent = `
    html[data-iotek-selecting="true"] * {
      cursor: crosshair !important;
    }

    .${HOVER_CLASS},
    .${SELECTED_CLASS} {
      position: relative;
    }

    #${OVERLAY_ID} {
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
      border: 2px dashed #38bdf8;
      border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.16), 0 0 18px rgba(56, 189, 248, 0.28);
      display: none;
    }

    #${OVERLAY_ID}[data-kind="selected"] {
      border-color: #38bdf8;
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.16), 0 0 18px rgba(56, 189, 248, 0.28);
    }

    #${OVERLAY_ID}::before {
      content: attr(data-label);
      position: absolute;
      left: -2px;
      top: -22px;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: #38bdf8;
      color: #031018;
      border-radius: 6px;
      padding: 2px 6px;
      font: 800 10px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #${OVERLAY_ID}[data-kind="selected"]::before {
      background: #38bdf8;
      color: #031018;
    }
  `;
  document.head.appendChild(style);
}

function selectionOverlay() {
  if (typeof document === 'undefined') return null;
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function showSelectionOverlay(element: Element, kind: 'hover' | 'selected', label: string) {
  const overlay = selectionOverlay();
  if (!overlay) return;
  const rect = element.getBoundingClientRect();
  // Align exactly with the element (fixed-positioned overlay and the element's
  // client rect share the iframe viewport, so they stay aligned under the host
  // phone-frame scale). Do not clamp left/top — clamping shifts the box.
  overlay.style.display = 'block';
  overlay.style.left = `${rect.left}px`;
  overlay.style.top = `${rect.top}px`;
  overlay.style.width = `${Math.max(8, rect.width)}px`;
  overlay.style.height = `${Math.max(8, rect.height)}px`;
  overlay.dataset.kind = kind;
  overlay.dataset.label = label || 'element';
}

function hideSelectionOverlay() {
  const overlay = selectionOverlay();
  if (!overlay) return;
  overlay.style.display = 'none';
}

function selectableElementFromEvent(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target : null;
  return target?.closest(SELECTABLE_SELECTOR) ?? null;
}

export function IotekPreviewBridge() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    ensureBridgeStyle();
    postToHost({ type: 'iotek:screens', screens: SCREEN_OPTIONS });

    let selectionMode = false;
    let hoveredElement: Element | null = null;
    let selectedElement: Element | null = null;

    function clearHover() {
      hoveredElement?.classList.remove(HOVER_CLASS);
      hoveredElement = null;
      if (!selectedElement) hideSelectionOverlay();
      postToHost({ type: 'iotek:elementHoverClear' });
    }

    function clearSelected() {
      selectedElement?.classList.remove(SELECTED_CLASS);
      selectedElement = null;
      hideSelectionOverlay();
    }

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
        if (!selectionMode) clearHover();
        return;
      }
      if (type === 'iotek:clearSelection' || type === 'iotek:preview:clearSelection') {
        selectionMode = false;
        document.documentElement.dataset.iotekSelecting = 'false';
        clearHover();
        clearSelected();
      }
    }

    function handleSelectMove(event: MouseEvent) {
      if (!selectionMode) return;
      const nextElement = selectableElementFromEvent(event);
      if (nextElement === hoveredElement) return;
      clearHover();
      if (nextElement && nextElement !== selectedElement) {
        hoveredElement = nextElement;
        hoveredElement.classList.add(HOVER_CLASS);
        showSelectionOverlay(hoveredElement, 'hover', elementLabel(hoveredElement));
        postToHost({
          type: 'iotek:elementHover',
          rect: elementRect(hoveredElement),
          label: elementLabel(hoveredElement),
          elementId: elementId(hoveredElement),
        });
      }
    }

    function handleSelectClick(event: MouseEvent) {
      if (!selectionMode) return;
      const selected = selectableElementFromEvent(event);
      if (!selected) return;
      event.preventDefault();
      event.stopPropagation();
      selectionMode = false;
      document.documentElement.dataset.iotekSelecting = 'false';
      clearHover();
      clearSelected();
      selectedElement = selected;
      selectedElement.classList.add(SELECTED_CLASS);
      showSelectionOverlay(selectedElement, 'selected', elementLabel(selected));
      postToHost({
        type: 'iotek:elementSelected',
        selection: {
          elementId: elementId(selected),
          label: elementLabel(selected),
          screen: pathname ?? undefined,
          description: `${selected.tagName.toLowerCase()} on ${pathname ?? 'current screen'}`,
          editableFields: editableFieldsFor(selected),
          rect: elementRect(selected),
        },
      });
    }

    function handleSelectKeyDown(event: KeyboardEvent) {
      if (!selectionMode || event.key !== 'Escape') return;
      selectionMode = false;
      document.documentElement.dataset.iotekSelecting = 'false';
      clearHover();
    }

    window.addEventListener('message', handleHostMessage);
    document.addEventListener('mousemove', handleSelectMove, true);
    document.addEventListener('click', handleSelectClick, true);
    document.addEventListener('keydown', handleSelectKeyDown, true);
    return () => {
      window.removeEventListener('message', handleHostMessage);
      document.removeEventListener('mousemove', handleSelectMove, true);
      document.removeEventListener('click', handleSelectClick, true);
      document.removeEventListener('keydown', handleSelectKeyDown, true);
      clearHover();
      clearSelected();
      delete document.documentElement.dataset.iotekSelecting;
    };
  }, [pathname, router]);

  return null;
}
