import { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter, useSitemap, type SitemapType } from 'expo-router';

type ScreenOption = {
  id: string;
  label: string;
};

// Used only until the route tree is ready; ids are navigable paths.
const FALLBACK_SCREENS: ScreenOption[] = [
  { id: '/welcome', label: 'Welcome' },
  { id: '/login', label: 'Login' },
  { id: '/home', label: 'Home' },
];

const DYNAMIC_SEGMENT = /^\[.*\]$/;
const GROUP_SEGMENT = /^\(.*\)$/;

function humanizeSegment(segment: string) {
  return segment.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function currentCameraId(pathname: string | null) {
  const match = pathname?.match(/^\/camera\/([^/]+)/);
  return match?.[1] ?? 'preview';
}

// Flatten expo-router's sitemap into the dropdown's navigable screens, so the
// list always reflects the pages that actually exist in the running app
// (including pages added later) instead of a hardcoded list.
function collectSitemapScreens(
  node: SitemapType | null,
  cameraId: string,
  out: ScreenOption[],
): ScreenOption[] {
  if (!node) return out;
  const href = typeof node.href === 'string' ? node.href : '';
  const isLeaf = !node.children || node.children.length === 0;
  if (isLeaf && !node.isInternal && !node.isGenerated && href) {
    const rawSegments = href.replace(/^\//, '').split('/').filter(Boolean);
    const hasEntropy = rawSegments.some((segment) => /^\d{10,}$/.test(segment));
    // Route groups like "(tabs)" are transparent in URLs — drop them.
    const segments = rawSegments.filter((seg) => !GROUP_SEGMENT.test(seg));
    if (segments.length > 0 && !hasEntropy) {
      const id = '/' + segments.map((seg) => (DYNAMIC_SEGMENT.test(seg) ? cameraId : seg)).join('/');
      const label =
        segments.filter((seg) => !DYNAMIC_SEGMENT.test(seg)).map(humanizeSegment).join(' ') || 'Home';
      if (!out.some((option) => option.id === id)) out.push({ id, label });
    }
  }
  (node.children ?? []).forEach((child) => collectSitemapScreens(child, cameraId, out));
  return out;
}

function screenPath(screenId: string, pathname: string | null) {
  if (!screenId) return null;
  const path = screenId.startsWith('/') ? screenId : `/${screenId}`;
  // Keep camera routes pointing at the camera currently in context.
  if (path.startsWith('/camera/')) {
    return path.replace(/^\/camera\/[^/]+/, `/camera/${currentCameraId(pathname)}`);
  }
  return path;
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
      box-sizing: border-box;
      /* Expo/react-native-web injects "body > div, #root > div { height:100%;
         min-height:100% }". The overlay is a direct child of <body>, so without
         this it gets clamped to full viewport height (a tall strip) no matter
         what inline height we set. The #id selector outranks "body > div", so
         these win and the box honors its real width/height. */
      min-height: 0;
      min-width: 0;
      max-height: none;
      max-width: none;
      height: auto;
      width: auto;
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

// The rectangle the dashed box should hug. Full-width controls (e.g. a centered
// "Login" button) have an element box that spans the whole row, but the visible
// content is just the text. When the element renders text, measure the text's
// own bounding box with a Range and use it if it is meaningfully tighter, so the
// box frames the words the user pointed at rather than the full-width control.
function overlayRect(element: Element): DOMRect {
  const rect = element.getBoundingClientRect();
  // Text can be nested (a centered "Login" sits in a child span inside a
  // full-width button), so measure the rendered text of the whole subtree with
  // a Range, not just direct text nodes. The Range box hugs the glyphs, so the
  // dashed box frames the words even when the user pointed at the control's
  // padding rather than the text itself.
  const hasText = (element.textContent ?? '').trim().length > 0;
  if (!hasText || typeof document.createRange !== 'function') return rect;
  try {
    const range = document.createRange();
    range.selectNodeContents(element);
    const tr = range.getBoundingClientRect();
    if (tr.width > 0 && tr.height > 0 && tr.width <= rect.width + 1 && tr.height <= rect.height + 1) {
      return tr;
    }
  } catch {
    // Range measurement unsupported — fall back to the element box.
  }
  return rect;
}

function showSelectionOverlay(element: Element, kind: 'hover' | 'selected', label: string) {
  const overlay = selectionOverlay();
  if (!overlay) return;
  const rect = overlayRect(element);
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
  let node = event.target instanceof Element ? event.target : null;
  if (!node) return null;
  // event.target is the hit-test target, which in React-Native-Web is often a
  // big wrapper (inner Text/View frequently route pointer events to an outer
  // container). Descend by geometry into the deepest descendant that still
  // contains the cursor, so the dashed box frames the specific text/control
  // under the pointer (e.g. the "Email" label) rather than the whole form.
  const x = event.clientX;
  const y = event.clientY;
  for (;;) {
    let next: Element | null = null;
    for (const child of Array.from(node.children)) {
      if (child.id === OVERLAY_ID) continue;
      const r = child.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        next = child;
        break;
      }
    }
    if (!next) break;
    node = next;
  }
  return node;
}

const PREVIEW_ROUTE_KEY = 'iotek:previewRoute';

export function IotekPreviewBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const sitemap = useSitemap();
  const screens = useMemo(() => collectSitemapScreens(sitemap, 'preview', []), [sitemap]);
  const screenList = screens.length > 0 ? screens : FALLBACK_SCREENS;
  const screensRef = useRef<ScreenOption[]>(screenList);
  screensRef.current = screenList;

  // Re-send the dropdown screens to the host whenever the route tree changes,
  // so newly added pages show up without a hardcoded list.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    postToHost({ type: 'iotek:screens', screens: screenList });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitemap]);

  // Remember the screen across preview reloads. An AI edit reloads the iframe
  // (cache-bust) to show new code; a fresh load drops the SPA back on its first
  // screen, which is jarring when the user was editing e.g. the Login page.
  // Persist the current route and restore it once on mount so the preview stays
  // on the page the user was working on.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (pathname && pathname !== '/') {
      try {
        window.sessionStorage.setItem(PREVIEW_ROUTE_KEY, pathname);
      } catch {
        // sessionStorage unavailable — route restore is a nice-to-have.
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let saved: string | null = null;
    try {
      saved = window.sessionStorage.getItem(PREVIEW_ROUTE_KEY);
    } catch {
      saved = null;
    }
    if (!saved || saved === '/' || saved === pathname) return;
    // Defer one tick so expo-router has finished its initial mount/redirect.
    const id = setTimeout(() => {
      try {
        router.replace(saved as never);
      } catch {
        // ignore unknown/blocked routes
      }
    }, 0);
    return () => clearTimeout(id);
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    ensureBridgeStyle();
    postToHost({ type: 'iotek:screens', screens: screensRef.current });

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
        postToHost({ type: 'iotek:screens', screens: screensRef.current });
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
        // Only clear the current hover/selection. Do NOT exit selection mode
        // here — the mode is controlled solely by iotek:setSelectionMode. The
        // host clears the previous pick right after enabling selection, and if
        // clearSelection also flipped selectionMode off it would immediately
        // cancel the mode the user just turned on (no box, nothing selectable).
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
