/**
 * Utility functions for screenshot selection in the browser
 */

// Tracks the active cleanup function so selection can be cancelled externally
let activeCleanup = null;

/**
 * Enables screenshot area selection mode in the browser.
 * Draw a selection, then resize (via 8 edge/corner handles) or move it.
 * Every mouseup sends crop coordinates to the side panel which re-crops from
 * a pre-captured full-tab image — the overlay never hides, so there's no blink.
 * @param {Object} [options]
 * @param {boolean} [options.showDimensions=false] Show width×height label
 */
export function enableSelectionMode(options = {}) {
  const { showDimensions = false } = options;
  const HANDLE_SIZE = 10;
  const HANDLE_HALF = HANDLE_SIZE / 2;

  // ── Overlay ───────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'transparent',
    zIndex: '9999',
    cursor: 'crosshair',
  });

  // ── Selection box ─────────────────────────────────────────────────────────
  const selectionBox = document.createElement('div');
  Object.assign(selectionBox.style, {
    position: 'absolute',
    border: 'none',
    outline: '2px dashed #e0e0e0',
    outlineOffset: '0px',
    background: 'transparent',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
    display: 'none',
    cursor: 'move',
  });
  overlay.appendChild(selectionBox);

  // ── Dimension label ───────────────────────────────────────────────────────
  const dimLabel = document.createElement('div');
  Object.assign(dimLabel.style, {
    position: 'absolute',
    bottom: '-24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    userSelect: 'none',
    display: showDimensions ? 'block' : 'none',
  });
  selectionBox.appendChild(dimLabel);

  // ── Resize handles ────────────────────────────────────────────────────────
  const handlePositions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const cursorMap = {
    nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
    se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
  };
  const handles = {};

  handlePositions.forEach((pos) => {
    const h = document.createElement('div');
    Object.assign(h.style, {
      position: 'absolute',
      width: HANDLE_SIZE + 'px',
      height: HANDLE_SIZE + 'px',
      background: '#bbb',
      border: '1px solid #fff',
      borderRadius: '2px',
      cursor: cursorMap[pos],
      zIndex: '1',
    });
    h.dataset.handle = pos;
    handles[pos] = h;
    selectionBox.appendChild(h);
  });

  function positionHandles() {
    const w = selectionBox.offsetWidth;
    const h = selectionBox.offsetHeight;
    const set = (el, l, t) => { el.style.left = l + 'px'; el.style.top = t + 'px'; };
    set(handles.nw, -HANDLE_HALF, -HANDLE_HALF);
    set(handles.n, w / 2 - HANDLE_HALF, -HANDLE_HALF);
    set(handles.ne, w - HANDLE_HALF, -HANDLE_HALF);
    set(handles.e, w - HANDLE_HALF, h / 2 - HANDLE_HALF);
    set(handles.se, w - HANDLE_HALF, h - HANDLE_HALF);
    set(handles.s, w / 2 - HANDLE_HALF, h - HANDLE_HALF);
    set(handles.sw, -HANDLE_HALF, h - HANDLE_HALF);
    set(handles.w, -HANDLE_HALF, h / 2 - HANDLE_HALF);
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let phase = 'drawing'; // 'drawing' | 'idle' | 'moving' | 'resizing'
  let startX, startY;
  let dragOffsetX, dragOffsetY;
  let activeHandle = null;
  let resizeOrigin = {};

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getBox() {
    return {
      x: parseInt(selectionBox.style.left, 10),
      y: parseInt(selectionBox.style.top, 10),
      w: parseInt(selectionBox.style.width, 10),
      h: parseInt(selectionBox.style.height, 10),
    };
  }

  function setBox(x, y, w, h) {
    selectionBox.style.left = x + 'px';
    selectionBox.style.top = y + 'px';
    selectionBox.style.width = w + 'px';
    selectionBox.style.height = h + 'px';
    dimLabel.textContent = `${w} × ${h}`;
    positionHandles();
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // ── DOM setup ─────────────────────────────────────────────────────────────
  document.body.appendChild(overlay);

  function removeOverlay() {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
    document.removeEventListener('keydown', handleKeyDown);
    activeCleanup = null;
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      removeOverlay();
      chrome.runtime.sendMessage({ action: 'selectionCancelled' });
    }
  }

  document.addEventListener('keydown', handleKeyDown);
  activeCleanup = removeOverlay;

  // ── Auto-capture ──────────────────────────────────────────────────────────
  // The full tab was already captured by the side panel before the overlay was
  // shown. Every mouseup just sends crop coordinates — no visibility toggling.
  function captureArea() {
    const rect = selectionBox.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const area = {
      x: Math.round(rect.left * devicePixelRatio),
      y: Math.round(rect.top * devicePixelRatio),
      width: Math.round(rect.width * devicePixelRatio),
      height: Math.round(rect.height * devicePixelRatio),
    };

    chrome.runtime.sendMessage({
      action: 'areaCropUpdate',
      area,
      devicePixelRatio,
    });
  }

  // ── Mouse interaction ─────────────────────────────────────────────────────
  overlay.addEventListener('mousedown', (e) => {
    const target = e.target;

    // Click on a resize handle
    if (target.dataset && target.dataset.handle) {
      e.stopPropagation();
      phase = 'resizing';
      activeHandle = target.dataset.handle;
      const box = getBox();
      resizeOrigin = { x: box.x, y: box.y, w: box.w, h: box.h };
      startX = e.clientX;
      startY = e.clientY;
      return;
    }

    // Click inside the selection box → move
    if (target === selectionBox || selectionBox.contains(target)) {
      e.stopPropagation();
      phase = 'moving';
      const box = getBox();
      dragOffsetX = e.clientX - box.x;
      dragOffsetY = e.clientY - box.y;
      return;
    }

    // Click on the overlay → start a new selection
    phase = 'drawing';
    startX = e.clientX;
    startY = e.clientY;
    setBox(startX, startY, 0, 0);
    selectionBox.style.display = 'block';
  });

  overlay.addEventListener('mousemove', (e) => {
    const maxW = overlay.offsetWidth;
    const maxH = overlay.offsetHeight;

    if (phase === 'drawing') {
      const cx = clamp(e.clientX, 0, maxW);
      const cy = clamp(e.clientY, 0, maxH);
      const x = Math.min(cx, startX);
      const y = Math.min(cy, startY);
      const w = Math.abs(cx - startX);
      const h = Math.abs(cy - startY);
      setBox(x, y, w, h);
      return;
    }

    if (phase === 'moving') {
      const box = getBox();
      let nx = e.clientX - dragOffsetX;
      let ny = e.clientY - dragOffsetY;
      nx = clamp(nx, 0, maxW - box.w);
      ny = clamp(ny, 0, maxH - box.h);
      setBox(nx, ny, box.w, box.h);
      return;
    }

    if (phase === 'resizing') {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let { x, y, w, h } = resizeOrigin;

      if (activeHandle.includes('w')) { x += dx; w -= dx; }
      if (activeHandle.includes('e')) { w += dx; }
      if (activeHandle.includes('n')) { y += dy; h -= dy; }
      if (activeHandle.includes('s')) { h += dy; }

      const minSize = 10;
      if (w < minSize) { if (activeHandle.includes('w')) x = resizeOrigin.x + resizeOrigin.w - minSize; w = minSize; }
      if (h < minSize) { if (activeHandle.includes('n')) y = resizeOrigin.y + resizeOrigin.h - minSize; h = minSize; }
      x = clamp(x, 0, maxW - minSize);
      y = clamp(y, 0, maxH - minSize);
      if (x + w > maxW) w = maxW - x;
      if (y + h > maxH) h = maxH - y;

      setBox(x, y, w, h);
      return;
    }
  });

  overlay.addEventListener('mouseup', () => {
    if (phase === 'drawing' || phase === 'resizing' || phase === 'moving') {
      phase = 'idle';
      activeHandle = null;
      captureArea();
    }
  });
}

/**
 * Cancels the active selection mode and removes the overlay.
 * Called when a cancelSelection message is received from the side panel.
 */
export function cancelSelectionMode() {
  if (activeCleanup) {
    activeCleanup();
  }
}

/**
 * Capture a full page screenshot using html2canvas (if available)
 * This is a helper function that may be useful in the future
 */
export function captureFullPageScreenshot() {
  if (typeof html2canvas !== 'undefined') {
    html2canvas(document.body).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      downloadImage(imgData, 'fullpage_screenshot.png');
    });
  } else {
    console.error('html2canvas is not available');
  }
}

/**
 * Helper function to download an image
 * @param {string} data - The image data URL
 * @param {string} filename - The filename to use for the download
 */
export function downloadImage(data, filename) {
  const a = document.createElement('a');
  a.href = data;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
